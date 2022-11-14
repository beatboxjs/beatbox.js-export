import WavEncoder from 'wav-encoder';
import Beatbox from 'beatbox.js';
import lamejs from "lamejs";

type ProgressCallback = (progress: number) => boolean | undefined | Promise<boolean | undefined>;

export async function exportWAV(beatbox: Beatbox, progressCallback?: ProgressCallback): Promise<Blob | undefined> {
	const audioBuffer = await new Beatbox(beatbox._pattern, beatbox._strokeLength, false).record();

	if (await progressCallback?.(0.4) === false)
		return undefined;
	await nextTick();

	const channelData = [];
	for (let i = 0; i < audioBuffer.numberOfChannels; i++)
		channelData.push(audioBuffer.getChannelData(i));
	const buffer = await WavEncoder.encode({
		sampleRate: audioBuffer.sampleRate,
		channelData
	});

	if (await progressCallback?.(1) === false)
		return undefined;

	return new Blob([ buffer ], { type: "audio/wav" });
}

export async function exportMP3(beatbox: Beatbox, progressCallback?: ProgressCallback): Promise<Blob | undefined> {
	const audioBuffer = await new Beatbox(beatbox._pattern, beatbox._strokeLength, false).record();

	const channelData = new Array(audioBuffer.numberOfChannels);
	for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
		const ch = audioBuffer.getChannelData(i);
		channelData[i] = new Int32Array(ch.length);
		for (let j = 0; j < ch.length; j++) {
			channelData[i][j] = ch[j] < 0 ? ch[j] * 32768 : ch[j] * 32767;

			if (j != 0 && j % 100000 == 0) {
				if (await progressCallback?.(0.1 * (i + j / ch.length) / audioBuffer.numberOfChannels) === false)
					return undefined;
				await nextTick();
			}
		}
	}

	if (await progressCallback?.(0.1) === false)
		return undefined;
	await nextTick();

	const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);

	const data = [ ];
	const bufferLength = 1152;
	for(let i = 0; i < channelData[0].length; i += bufferLength) {
		const mp3buf = mp3encoder.encodeBuffer(...channelData.map((channel) => channel.subarray(i, i+bufferLength)));
		if (mp3buf.length > 0)
			data.push(mp3buf);

		if (await progressCallback?.(0.1 + 0.9 * Math.min(channelData[0].length, i + bufferLength) / channelData[0].length) === false)
			return undefined;
		await nextTick();
	}

	const mp3buf = mp3encoder.flush();
	if (mp3buf.length > 0)
		data.push(mp3buf);

	return new Blob(data, { type: "audio/mp3" });
}

async function nextTick() {
	await new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
}