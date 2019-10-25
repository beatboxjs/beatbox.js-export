import AV from 'av';
import WavEncoder from 'wav-encoder';
import audioLib from '../lib/audiolib.js';
import Lame from '../lib/libmp3lame.js';
import Beatbox, { Pattern, SoundReference } from 'beatbox.js';
import 'mp3';

declare module "beatbox.js" {
	interface Beatbox {
		exportMP3: (progressCallback?: (progress: number) => void) => Promise<Blob>,
		exportWAV: (progressCallback?: (progress: number) => void) => Promise<Blob>
	}

	interface SoundReference {
		bbChannelData: LeftAndRight | null;
	}
}

type LeftAndRight = [Float32Array, Float32Array];

function qualifyURL(url: string): string {
	let el = document.createElement('div');
	el.innerHTML = '<a href="'+url.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;')+'">x</a>';
	return (el.firstChild as HTMLLinkElement).href;
}

function str2ab(str: string): ArrayBuffer {
	let buf = new ArrayBuffer(str.length);
	let bufView = new Uint8Array(buf);
	for (let i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

function sliceTypedArray<T extends AV.TypedArray>(arr: T, start: number, end: number): T {
	if(arr.slice)
		return arr.slice(start, end) as T;

	let ret = new (arr.constructor(end-start) as any) as T;
	for(let i=start,j=0; i<end; i++,j++)
		ret[j] = arr[i];
	return ret;
}

const outputSampleRate = 44100;

async function getWaveForInstrument(instrumentObj: SoundReference): Promise<LeftAndRight> {
	if(instrumentObj.bbChannelData)
		return instrumentObj.bbChannelData;

	if(!instrumentObj.howl.bbChannelData) {
		let url = instrumentObj.howl._src;

		let asset: AV.Asset | null = null;
		const m = url.match(/^data:([^,]*),(.*)$/);
		if(m) {
			const url = decodeURIComponent(m[2]);
			asset = AV.Asset.fromBuffer(str2ab(m[1].endsWith(";base64") ? atob(url) : url));
		} else
			asset = AV.Asset.fromURL(qualifyURL(url));

		try {
			instrumentObj.howl.bbChannelData = await decodeToBuffer(asset);
		} catch(e) {
			console.error("Error decoding "+instrumentObj.howl._src+":", e);
			instrumentObj.howl.bbChannelData = [ new Float32Array(0), new Float32Array(0) ];
		}
	}

	if(instrumentObj.sprite) {
		let sprite = instrumentObj.howl._sprite[instrumentObj.sprite] || [ 0, 0 ];
		instrumentObj.bbChannelData = [
			sliceTypedArray(instrumentObj.howl.bbChannelData[0], sprite[0] * outputSampleRate / 1000, (sprite[0] + sprite[1]) * outputSampleRate / 1000),
			sliceTypedArray(instrumentObj.howl.bbChannelData[1], sprite[0] * outputSampleRate / 1000, (sprite[0] + sprite[1]) * outputSampleRate / 1000)
		];
	} else
		instrumentObj.bbChannelData = instrumentObj.howl.bbChannelData;

	return instrumentObj.bbChannelData;
}

async function decodeToBuffer(asset: AV.Asset): Promise<LeftAndRight> {
	let buffer: Float32Array = await new Promise((resolve, reject) => {
		asset.decodeToBuffer(resolve);
		asset.on("error", reject);
	});

	let format: AV.Format = await new Promise((resolve, reject) => {
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

	if(format.sampleRate != outputSampleRate) {
		left = audioLib.Sink.resample(left, format.sampleRate, outputSampleRate);
		right = audioLib.Sink.resample(right, format.sampleRate, outputSampleRate);
	}

	return [ left, right ];
}

async function encodeWAV(left: Float32Array, right: Float32Array): Promise<Blob> {
	let buffer = await WavEncoder.encode({
		sampleRate: outputSampleRate,
		channelData: [
			left,
			right
		]
	});

	return new Blob([ buffer ], { type: "audio/wav" });
}

async function encodeMP3(left: Float32Array, right: Float32Array, progressCallback?: (progress: number) => void): Promise<Blob> {
	let mp3codec = Lame.init();
	Lame.set_mode(mp3codec, Lame.JOINT_STEREO);
	Lame.set_num_channels(mp3codec, 2);
	Lame.set_in_samplerate(mp3codec, outputSampleRate);
	Lame.set_out_samplerate(mp3codec, outputSampleRate);
	Lame.set_bitrate(mp3codec, 128);
	Lame.init_params(mp3codec);

	let data = [ ];
	let bufferLength = 5000;
	for(let i=0; i<left.length; i+=bufferLength) {
		data.push(Lame.encode_buffer_ieee_float(mp3codec, left.subarray(i, i+bufferLength), right.subarray(i, i+bufferLength)).data);
		progressCallback && progressCallback(i/left.length);

		await nextTick();
	}

	data.push(Lame.encode_flush(mp3codec).data);

	Lame.close(mp3codec);

	return new Blob(data, { type: "audio/mp3" });
}

async function getBufferForPattern(pattern: Pattern, strokeLength: number, progressCallback?: (progress: number) => void): Promise<LeftAndRight> {
	let bufferL = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*outputSampleRate / 1000));
	let bufferR = new Float32Array(Math.ceil((3000+pattern.length*strokeLength)*outputSampleRate / 1000));
	let maxPos = 0;
	let lastProgress = 0;

	for(let i=0; i<pattern.length; i++) {
		const part = pattern[i] || [];
		for(let j=0; j<part.length; j++) {
			await nextTick();

			let instrWithParams = Beatbox._getInstrumentWithParams(part[j]);
			if(!instrWithParams)
				continue;

			let channelData = await getWaveForInstrument(instrWithParams.instrumentObj);

			if(channelData) {
				let pos,waveIdx;
				for(pos=Math.floor(i*strokeLength*outputSampleRate / 1000),waveIdx=0; waveIdx<channelData[0].length; pos++,waveIdx++) {
					bufferL[pos] += channelData[0][waveIdx] * instrWithParams.volume;
					bufferR[pos] += channelData[1][waveIdx] * instrWithParams.volume;
				}
				maxPos = Math.max(maxPos, pos);
			}
		}

		await nextTick();

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
}

async function nextTick() {
	await new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}

Beatbox.prototype.exportMP3 = async function(progressCallback?: (progress: number) => void): Promise<Blob> {
	let [ left, right ] = await getBufferForPattern(this._pattern, this._strokeLength, (progress) => { progressCallback && progressCallback(progress*.25) });
	return await encodeMP3(left, right, (progress) => { progressCallback && progressCallback(.25 + progress*.75) });
};

Beatbox.prototype.exportWAV = async function(progressCallback?: (progress: number) => void): Promise<Blob> {
	let [ left, right ] = await getBufferForPattern(this._pattern, this._strokeLength, progressCallback);
	return await encodeWAV(left, right);
};
