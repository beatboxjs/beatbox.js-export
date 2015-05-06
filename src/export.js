Beatbox.prototype.export = function() {
	function getWave(instr, callback) {
		if(instr.bbWave)
			return callback(bbWave);

		async.waterfall([
			function(next) {
				if(instr.soundObj.bbWave)
					return next(null, instr.soundObj.bbWave);

				JSZipUtils.getBinaryContent(qualifyURL(instr.soundObj._urls[0]), function(err, data) {
					console.log(err, data);
					if(err)
						return console.error(err);

					AV.Asset.fromBuffer(data).decodeToBuffer(function(buffer) {
						instr.soundObj.bbWave = buffer;
						next(null, buffer);
					});
				});
			},
			function(soundWave, next) {
				instr.bbWave = soundWave; // TODO: Sprite

				callback(null, instr.bbWave);
			}
		]);
	}

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

	var bufferL = [ ];
	var bufferR = [ ];

	var i = 0;
	var p = this._pattern;
	async.eachSeries(arrayKeys(p), function(i, next) {
		async.eachSeries(arrayKeys(p[i]), function(j, next) {
			var instrWithParams = Beatbox._getInstrumentWithParams(p[i][j]);
			if(!instrWithParams)
				return next();

			getWave(instrWithParams.instrumentObj, function(wave) {
				console.log(wave);

				next();
			});
		}, next);
	}, function(err) {
		console.log("done");
	});
};