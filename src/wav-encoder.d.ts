// Type definitions for wav-encoder 1.3.0
// Project: https://github.com/mohayonao/wav-encoder
// Definitions by: Candid Dauth https://github.com/cdauth

declare namespace WavEncoder {
	export interface AudioData {
		sampleRate: number;
		channelData: Float32Array[];
	}

	export interface Options {
		bitDepth: number,
		float: boolean,
		symmetric: boolean
	}

}

declare module "wav-encoder" {
	import AudioData = WavEncoder.AudioData;
	import Options = WavEncoder.Options;

	const WavEncoder: {
		encode: {
			(audioData: AudioData, opts?: Options): Promise<ArrayBuffer>,
			sync: (audioData: AudioData, opts?: Options) => ArrayBuffer
		}
	};

	export = WavEncoder;
}
