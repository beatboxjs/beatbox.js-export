import AV from 'av';
import WavEncoder from 'wav-encoder';
import audioLib from '../lib/audiolib.js';
import Lame from '../lib/libmp3lame.js';
import Beatbox from 'beatbox.js';

function qualifyURL(url) {
	let el = document.createElement('div');
	el.innerHTML = '<a href="'+url.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;')+'">x</a>';
	return el.firstChild.href;
}

function str2ab(str) {
	let buf = new ArrayBuffer(str.length);
	let bufView = new Uint8Array(buf);
	for (let i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

function sliceTypedArray(arr, start, end) {
	if(arr.slice)
		return arr.slice(start, end);

	let ret = new arr.constructor(end-start);
	for(let i=start,j=0; i<end; i++,j++)
		ret[j] = arr[i];
	return ret;
}

let e = Beatbox.Export = {
	_outputSampleRate : 44100,

	async _getWaveForInstrument(instrumentObj) {
		if(instrumentObj.bbChannelData)
			return instrumentObj.bbChannelData;

		let channelData = null;
		if(typeof instrumentObj.soundObj.bbChannelData != "undefined")
			channelData = instrumentObj.soundObj.bbChannelData;
		else {
			let url = instrumentObj.soundObj._src;

			let asset = null;
			if(url.match(/^data:/)) {
				let m = url.match(/base64,(.*)$/);
				asset = AV.Asset.fromBuffer(str2ab(atob(m[1])));
			} else
				asset = AV.Asset.fromURL(qualifyURL(url));

			try {
				channelData = await e._decodeToBuffer(asset);
			} catch(e) {
				console.error("Error decoding "+instrumentObj.soundObj._src+":", e);
			}

			instrumentObj.soundObj.bbChannelData = channelData || null;

			if(instrumentObj.sprite) {
				instrumentObj.bbChannelData = [ ];
				let sprite = instrumentObj.soundObj._sprite[instrumentObj.sprite] || [ 0, 0 ];
				for(let i=0; i<channelData.length; i++) {
					instrumentObj.bbChannelData.push(sliceTypedArray(channelData[i], sprite[0] * e._outputSampleRate / 1000, (sprite[0] + sprite[1]) * e._outputSampleRate / 1000));
				}
			} else
				instrumentObj.bbChannelData = channelData;

			return instrumentObj.bbChannelData;
		}
	},

	async _decodeToBuffer(asset) {
		let buffer = await new Promise((resolve, reject) => {
			asset.decodeToBuffer(resolve);
			asset.on("error", reject);
		});

		let format = await new Promise((resolve, reject) => {
			asset.get("format", resolve);
			asset.on("error", reject);
		});

		let length = Math.ceil(buffer.length / format.channelsPerFrame);

		let left = new Float32Array(length);
		let right = new Float32Array(length);

		for(let i=0; i<length; i++) {
			left[i] = buffer[i*format.channelsPerFrame];
			right[i] = buffer[i*format.channelsPerFrame + (format.channelsPerFrame > 1 ? 1 : 0)];
		}

		if(format.sampleRate != e._outputSampleRate) {
			left = audioLib.Sink.resample(left, format.sampleRate, e._outputSampleRate);
			right = audioLib.Sink.resample(right, format.sampleRate, e._outputSampleRate);
		}

		return [ left, right ];
	},

	async _encodeWAV(left, right) {
		let buffer = await WavEncoder.encode({
			sampleRate: e._outputSampleRate,
			channelData: [
				left,
				right
			]
		});

		return new Blob([ buffer ], { type: "audio/wav" });
	},

	async _encodeMP3(left, right, progressCallback) {
		let mp3codec = Lame.init();
		Lame.set_mode(mp3codec, Lame.JOINT_STEREO);
		Lame.set_num_channels(mp3codec, 2);
		Lame.set_in_samplerate(mp3codec, e._outputSampleRate);
		Lame.set_out_samplerate(mp3codec, e._outputSampleRate);
		Lame.set_bitrate(mp3codec, 128);
		Lame.init_params(mp3codec);

		let data = [ ];
		let bufferLength = 5000;
		for(let i=0; i<left.length; i+=bufferLength) {
			data.push(Lame.encode_buffer_ieee_float(mp3codec, left.subarray(i, i+bufferLength), right.subarray(i, i+bufferLength)).data);
			progressCallback && progressCallback(i/left.length);

			await this._nextTick();
		}

		data.push(Lame.encode_flush(mp3codec).data);

		Lame.close(mp3codec);

		return new Blob(data, { type: "audio/mp3" });
	},

	async _getBufferForPattern(pattern, strokeLength, progressCallback) {
		let bufferL = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*e._outputSampleRate / 1000));
		let bufferR = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*e._outputSampleRate / 1000));
		let maxPos = 0;
		let lastProgress = 0;

		for(let i=0; i<pattern.length; i++) {
			for(let j=0; j<pattern[i].length; j++) {
				await this._nextTick();

				let instrWithParams = Beatbox._getInstrumentWithParams(pattern[i][j]);
				if(!instrWithParams)
					continue;

				let channelData = await e._getWaveForInstrument(instrWithParams.instrumentObj);

				if(channelData) {
					let pos,waveIdx;
					for(pos=Math.floor(i*strokeLength*e._outputSampleRate / 1000),waveIdx=0; waveIdx<channelData[0].length; pos++,waveIdx++) {
						bufferL[pos] += channelData[0][waveIdx] * instrWithParams.volume;
						bufferR[pos] += channelData[1][waveIdx] * instrWithParams.volume;
					}
					maxPos = Math.max(maxPos, pos);
				}
			}

			await this._nextTick();

			let newProgress = i/pattern.length;
			if(newProgress - lastProgress > 0.003) {
				progressCallback && progressCallback(newProgress);
				lastProgress = newProgress;
			}
		}

		for(let i=0; i<bufferL.length; i++) {
			bufferL[i] = Math.tanh(bufferL[i]);
			bufferR[i] = Math.tanh(bufferR[i]);
		}

		return [ sliceTypedArray(bufferL, 0, maxPos), sliceTypedArray(bufferR, 0, maxPos) ];
	},

	async _nextTick() {
		await new Promise((resolve) => {
			setTimeout(resolve, 0);
		});
	}
};

Beatbox.prototype.exportMP3 = async function(progressCallback) {
	let [ left, right ] = await e._getBufferForPattern(this._pattern, this._strokeLength, (progress) => { progressCallback && progressCallback(progress*.25) });
	return await e._encodeMP3(left, right, (progress) => { progressCallback && progressCallback(.25 + progress*.75) });
};

Beatbox.prototype.exportWAV = async function(progressCallback) {
	let [ left, right ] = await e._getBufferForPattern(this._pattern, this._strokeLength, progressCallback);
	return await e._encodeWAV(left, right);
};
