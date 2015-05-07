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
		_getWaveForInstrument : function(instrumentWithParams, callback) {
			async.waterfall([
				function(next) {
					if(typeof instrumentWithParams.instrumentObj.soundObj.bbWave != "undefined")
						return next(null, instrumentWithParams.instrumentObj.soundObj.bbWave);

					var url = instrumentWithParams.instrumentObj.soundObj._urls[0];

					var asset = null;
					if(url.match(/^data:/)) {
						var m = url.match(/base64,(.*)$/);
						asset = AV.Asset.fromBuffer(str2ab(atob(m[1])));
					} else
						asset = AV.Asset.fromURL(qualifyURL(url));

					e._decodeToBuffer(asset, function(err, buffer) {
						if(err)
							console.error("Error decoding "+instrumentWithParams.instrumentObj.soundObj._urls[0]+":", err);

						instrumentWithParams.instrumentObj.soundObj.bbWave = buffer || null;

						// TODO: Respect channel count, sample rate
						next(null, buffer);
					});
				},
				function(soundWave, next) {
					// TODO: Respect Sprite
					instrumentWithParams.instrumentObj.bbWave = soundWave;

					var wave = instrumentWithParams.instrumentObj.bbWave;
					if(instrumentWithParams.volume != 1) {
						wave = new Float32Array(wave);
						for(var i=0; i<wave.length; i++)
							wave[i] *= instrumentWithParams.volume;
					}

					callback(wave);
				}
			]);
		},

		_decodeToBuffer : function(asset, callback) {
			asset.decodeToBuffer(function(buffer) {
				callback(null, buffer);
			});
			asset.on("error", function(err) {
				callback(err);
			});
		},

		_encodeWAV : function(left, right, callback) {
			WavEncoder.encode({
				sampleRate: 44100,
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
			Lame.set_in_samplerate(mp3codec, 44100);
			Lame.set_out_samplerate(mp3codec, 44100);
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
			var bufferL = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*44.1));
			var bufferR = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*44.1));
			var maxPos = 0;
			var lastProgress = 0;
			async.eachSeries(arrayKeys(pattern), function(i, next) {
				async.eachSeries(arrayKeys(pattern[i]), function(j, next) {
					var instrWithParams = Beatbox._getInstrumentWithParams(pattern[i][j]);
					if(!instrWithParams)
						return async.nextTick(next);

					e._getWaveForInstrument(instrWithParams, function(wave) {
						if(wave) {
							var pos,waveIdx;
							for(pos=Math.floor(i*strokeLength*44.1),waveIdx=0; waveIdx<wave.length; pos++,waveIdx+=1) {
								bufferL[pos] += wave[waveIdx];
								bufferR[pos] += wave[waveIdx];
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