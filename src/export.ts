import WavEncoder from 'wav-encoder';
import Beatbox, { BeatboxRecordOptions } from 'beatbox.js';
import { createMp3Encoder } from "wasm-media-encoders";

export type BeatboxExportOptions = Pick<BeatboxRecordOptions, "onProgress" | "signal">;

export async function exportWAV(beatbox: Beatbox, { onProgress, signal }: BeatboxExportOptions = {}): Promise<Blob> {
	signal?.throwIfAborted();

	const audioBuffer = await new Beatbox(beatbox._pattern, beatbox._strokeLength, false).record({
		onProgress: onProgress && ((p) => {
			onProgress(p * 0.4);
		}),
		signal
	});

	signal?.throwIfAborted();
	onProgress?.(0.4);

	const channelData = [];
	for (let i = 0; i < audioBuffer.numberOfChannels; i++)
		channelData.push(audioBuffer.getChannelData(i));

	const buffer = await WavEncoder.encode({
		sampleRate: audioBuffer.sampleRate,
		channelData
	});

	signal?.throwIfAborted();
	onProgress?.(1);

	return new Blob([ buffer ], { type: "audio/wav" });
}

export async function exportMP3(beatbox: Beatbox, { onProgress, signal }: BeatboxExportOptions = {}): Promise<Blob> {
	const [audioBuffer, encoder] = await Promise.all([
		new Beatbox(beatbox._pattern, beatbox._strokeLength, false).record({
			onProgress: onProgress && ((p) => {
				onProgress(p * 0.4);
			}),
			signal
		}),
		createMp3Encoder()
	]);

	signal?.throwIfAborted();
	onProgress?.(0.4);

	encoder.configure({
		sampleRate: audioBuffer.sampleRate,
		channels: audioBuffer.numberOfChannels as any,
		bitrate: 128
	});

	const channelData = [];
	for (let i = 0; i < audioBuffer.numberOfChannels; i++)
		channelData.push(audioBuffer.getChannelData(i));

	const data: Uint8Array[] = [];
	const bufferLength = 115200;
	for(let i = 0; i < channelData[0].length; i += bufferLength) {
		const mp3buf = encoder.encode(channelData.map((channel) => channel.subarray(i, i+bufferLength)));
		if (mp3buf.length > 0) {
			data.push(new Uint8Array(mp3buf));
		}

		signal?.throwIfAborted();
		onProgress?.(0.4 + 0.6 * Math.min(channelData[0].length, i + bufferLength) / channelData[0].length);
		await nextTick();
	}

	const mp3buf = encoder.finalize();
	if (mp3buf.length > 0) {
		data.push(new Uint8Array(mp3buf));
	}

	signal?.throwIfAborted();
	onProgress?.(1);

	return new Blob(data, { type: "audio/mp3" });
}

async function nextTick() {
	await new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
}