(function() {

	function arrayKeys(arr) {
		var ret = [ ];
		for(var i=0; i<arr.length; i++)
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

	var e = Beatbox.Export = {
		_getWaveForInstrument : function(instrumentObj, callback) {
			if(typeof instrumentObj.bbWave != "undefined")
				return callback(instrumentObj.bbWave);

			async.waterfall([
				function(next) {
					if(typeof instrumentObj.soundObj.bbWave != "undefined")
						return next(null, instrumentObj.soundObj.bbWave);

					var url = instrumentObj.soundObj._urls[0];

					var asset = null;
					if(url.match(/^data:/)) {
						var m = url.match(/base64,(.*)$/);
						asset = AV.Asset.fromBuffer(str2ab(atob(m[1])));
					} else
						asset = AV.Asset.fromURL(qualifyURL(url));

					e._decodeToBuffer(asset, function(err, buffer) {
						if(err)
							console.error("Error decoding "+instrumentObj.soundObj._urls[0]+":", err);

						instrumentObj.soundObj.bbWave = buffer || null;

						next(null, buffer);
					});
				},
				function(soundWave, next) {
					// TODO: Respect Sprite, channel count, rate
					instrumentObj.bbWave = soundWave;

					callback(instrumentObj.bbWave);
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

		_encodeMP3 : function(left, right, callback) {
			var mp3codec = Lame.init();
			Lame.set_mode(mp3codec, Lame.JOINT_STEREO);
			Lame.set_num_channels(mp3codec, 2);
			Lame.set_in_samplerate(mp3codec, 44100);
			Lame.set_out_samplerate(mp3codec, 44100);
			Lame.set_bitrate(mp3codec, 128);
			Lame.init_params(mp3codec);

			var data = [ ];
			var bufferLength = 20000;
			for(var i=0; i<left.length; i+=bufferLength) {
				data.push(Lame.encode_buffer_ieee_float(mp3codec, left.subarray(i, i+bufferLength), right.subarray(i, i+bufferLength)).data);
			}

			data.push(Lame.encode_flush(mp3codec).data);

			Lame.close(mp3codec);

			callback(new Blob(data, { type: "audio/mp3" }));
		},

		_getBufferForPattern : function(pattern, strokeLength, callback) {
			var bufferL = new Array(Math.ceil(pattern.length*strokeLength*44.1));
			var bufferR = new Array(Math.ceil(pattern.length*strokeLength*44.1));
			async.eachSeries(arrayKeys(pattern), function(i, next) {
				async.eachSeries(arrayKeys(pattern[i]), function(j, next) {
					var instrWithParams = Beatbox._getInstrumentWithParams(pattern[i][j]);
					if(!instrWithParams)
						return next();

					e._getWaveForInstrument(instrWithParams.instrumentObj, function(wave) {
						if(wave) {
							for(var pos=Math.floor(i*strokeLength*44.1),waveIdx=0; waveIdx<wave.length; pos++,waveIdx+=1) {
								if(!bufferL[pos])
									bufferL[pos] = 0;
								bufferL[pos] += wave[waveIdx];

								if(!bufferR[pos])
									bufferR[pos] = 0;
								bufferR[pos] += wave[waveIdx];
							}
						}

						next();
					});
				}, next);
			}, function() {
				callback(new Float32Array(bufferL), new Float32Array(bufferR));
			});
		}
	};

	Beatbox.prototype.exportMP3 = function(callback) {
		e._getBufferForPattern(this._pattern, this._strokeLength, function(left, right) {
			e._encodeMP3(left, right, callback);
		});
	};

	Beatbox.prototype.exportWAV = function(callback) {
		e._getBufferForPattern(this._pattern, this._strokeLength, function(left, right) {
			e._encodeWAV(left, right, callback);
		});
	};

})();