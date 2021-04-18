import "howler";

declare module "howler" {
	interface Howl {
		_src: string,
		_sprite: {
			[key: string]: [ number, number ]
		},
		bbChannelData?: [Float32Array, Float32Array]
	}
}