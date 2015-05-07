(function() {

	function arrayKeys(arr) {
		return forValues(0, arr.length, 1);
	}

	function forValues(start, limit, increase) {
		var ret = [ ];
		for(var i=start; i<limit; i+=increase)
			ret.push(i);
		return ret;
	}

	function qualifyURL(url) {
		var el = document.createElement('div');
		el.innerHTML = '<a href="'+url.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;')+'">x</a>';
		return el.firstChild.href;
	}

	function str2ab(str) {
		var buf = new ArrayBuffer(str.length);
		var bufView = new Uint8Array(buf);
		for (var i=0, strLen=str.length; i<strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}

	function sliceTypedArray(arr, start, end) {
		if(arr.slice)
			return arr.slice(start, end);

		var ret = new arr.constructor(end-start);
		for(var i=start,j=0; i<end; i++,j++)
			ret[j] = arr[i];
		return ret;
	}

	var e = Beatbox.Export = {
		_outputSampleRate : 44100,
		_getWaveForInstrument : function(instrumentObj, callback) {
			if(instrumentObj.bbChannelData)
				return callback(instrumentObj.bbChannelData);

			async.waterfall([
				function(next) {
					if(typeof instrumentObj.soundObj.bbChannelData != "undefined")
						return next(null, instrumentObj.soundObj.bbChannelData);

					var url = instrumentObj.soundObj._urls[0];

					var asset = null;
					if(url.match(/^data:/)) {
						var m = url.match(/base64,(.*)$/);
						asset = AV.Asset.fromBuffer(str2ab(atob(m[1])));
					} else
						asset = AV.Asset.fromURL(qualifyURL(url));


					e._decodeToBuffer(asset, function(err, channelData) {
						if(err)
							console.error("Error decoding "+instrumentObj.soundObj._urls[0]+":", err);

						instrumentObj.soundObj.bbChannelData = channelData || null;

						next(null, channelData);
					});
				},
				function(channelData, next) {
					if(instrumentObj.sprite) {
						instrumentObj.bbChannelData = [ ];
						var sprite = instrumentObj.soundObj._sprite[instrumentObj.sprite] || [ 0, 0 ];
						for(var i=0; i<channelData.length; i++) {
							instrumentObj.bbChannelData.push(sliceTypedArray(channelData[i], sprite[0] * e._outputSampleRate / 1000, (sprite[0] + sprite[1]) * e._outputSampleRate / 1000));
						}
					} else
						instrumentObj.bbChannelData = channelData;

					callback(instrumentObj.bbChannelData);
				}
			]);
		},

		_decodeToBuffer : function(asset, callback) {
			asset.decodeToBuffer(function(buffer) {
				asset.get("format", function(format) {
					var length = Math.ceil(buffer.length / format.channelsPerFrame);

					var left = new Float32Array(length);
					var right = new Float32Array(length);

					for(var i=0; i<length; i++) {
						left[i] = buffer[i*format.channelsPerFrame];
						right[i] = buffer[i*format.channelsPerFrame + (format.channelsPerFrame > 1 ? 1 : 0)];
					}

					if(format.sampleRate != e._outputSampleRate) {
						left = audioLib.Sink.resample(left, format.sampleRate, e._outputSampleRate);
						right = audioLib.Sink.resample(right, format.sampleRate, e._outputSampleRate);
					}

					callback(null, [ left, right ]);
				});
			});

			asset.on("error", callback);
		},

		_encodeWAV : function(left, right, callback) {
			WavEncoder.encode({
				sampleRate: e._outputSampleRate,
				channelData: [
					left,
					right
				]
			}).then(function(buffer) {
				callback(new Blob([ buffer ], { type: "audio/wav" }));
			})
		},

		_encodeMP3 : function(left, right, callback, progressCallback) {
			var mp3codec = Lame.init();
			Lame.set_mode(mp3codec, Lame.JOINT_STEREO);
			Lame.set_num_channels(mp3codec, 2);
			Lame.set_in_samplerate(mp3codec, e._outputSampleRate);
			Lame.set_out_samplerate(mp3codec, e._outputSampleRate);
			Lame.set_bitrate(mp3codec, 128);
			Lame.init_params(mp3codec);

			var data = [ ];
			var bufferLength = 5000;
			async.eachSeries(forValues(0, left.length, bufferLength), function(i, next) {
				data.push(Lame.encode_buffer_ieee_float(mp3codec, left.subarray(i, i+bufferLength), right.subarray(i, i+bufferLength)).data);
				progressCallback && progressCallback(i/left.length);
				async.nextTick(next);
			}, function() {
				data.push(Lame.encode_flush(mp3codec).data);

				Lame.close(mp3codec);

				callback(new Blob(data, { type: "audio/mp3" }));
			});
		},

		_getBufferForPattern : function(pattern, strokeLength, callback, progressCallback) {
			var bufferL = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*e._outputSampleRate / 1000));
			var bufferR = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*e._outputSampleRate / 1000));
			var maxPos = 0;
			var lastProgress = 0;
			async.eachSeries(arrayKeys(pattern), function(i, next) {
				async.eachSeries(arrayKeys(pattern[i]), function(j, next) {
					var instrWithParams = Beatbox._getInstrumentWithParams(pattern[i][j]);
					if(!instrWithParams)
						return async.nextTick(next);

					e._getWaveForInstrument(instrWithParams.instrumentObj, function(channelData) {
						if(channelData) {
							var pos,waveIdx;
							for(pos=Math.floor(i*strokeLength*e._outputSampleRate / 1000),waveIdx=0; waveIdx<channelData[0].length; pos++,waveIdx++) {
								bufferL[pos] += channelData[0][waveIdx] * instrWithParams.volume;
								bufferR[pos] += channelData[1][waveIdx] * instrWithParams.volume;
							}
							maxPos = Math.max(maxPos, pos);
						}

						async.nextTick(next);
					});
				}, function() {
					var newProgress = i/pattern.length;
					if(newProgress - lastProgress > 0.003) {
						progressCallback && progressCallback(newProgress);
						lastProgress = newProgress;
					}

					async.nextTick(next);
				});
			}, function() {
				for(var i=0; i<bufferL.length; i++) {
					bufferL[i] = Math.tanh(bufferL[i]);
					bufferR[i] = Math.tanh(bufferR[i]);
				}

				callback(sliceTypedArray(bufferL, 0, maxPos), sliceTypedArray(bufferR, 0, maxPos));
			});
		}
	};

	Beatbox.prototype.exportMP3 = function(callback, progressCallback) {
		e._getBufferForPattern(this._pattern, this._strokeLength, function(left, right) {
			e._encodeMP3(left, right, callback, function(progress) {
				progressCallback && progressCallback(.25 + progress*.75);
			});
		}, function(progress) {
			progressCallback && progressCallback(progress*.25);
		});
	};

	Beatbox.prototype.exportWAV = function(callback, progressCallback) {
		e._getBufferForPattern(this._pattern, this._strokeLength, function(left, right) {
			e._encodeWAV(left, right, callback);
		}, progressCallback);
	};

})();