interface Howl {
	_src: string,
	_sprite: {
		[key: string]: [ number, number ]
	},
	bbChannelData?: [Float32Array, Float32Array]
}

declare module "*/lib/audiolib.js";

declare module "*/lib/libmp3lame.js";