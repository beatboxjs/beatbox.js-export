/// <reference path="./asset.d.ts" />
/// <reference path="./filter.d.ts" />
/// <reference path="./eventEmitter.d.ts" />

declare namespace AV {

	class Player {
		static fromURL(url: string): Player;
		static fromFile(file: File): Player;
		static fromBuffer(buffer: BufferFormats): Player;

		buffered: number;
		duration: number;
		playing: boolean;
		currentTime: number;
		volume: number;
		pan: number;
		format?: Format;
		metadata: Metadata;
		asset: Asset;
		filters: Filter[];

		constructor(asset: Asset);

		preload(): void;
		play(): void;
		pause(): void;
		togglePlayback(): void;
		stop(): void;

		on(event: "buffer", fn: (percent: number) => void): void;
		off(event: "buffer", fn: (percent: number) => void): void;
		once(event: "buffer", fn: (percent: number) => void): void;
		emit(event: "buffer", fn: (percent: number) => void): void;

		on(event: "format", fn: (object: Format) => void): void;
		off(event: "format", fn: (object: Format) => void): void;
		once(event: "format", fn: (object: Format) => void): void;
		emit(event: "format", fn: (object: Format) => void): void;

		on(event: "duration", fn: (msecs: number) => void): void;
		off(event: "duration", fn: (msecs: number) => void): void;
		once(event: "duration", fn: (msecs: number) => void): void;
		emit(event: "duration", fn: (msecs: number) => void): void;

		on(event: "metadata", fn: (object: Metadata) => void): void;
		off(event: "metadata", fn: (object: Metadata) => void): void;
		once(event: "metadata", fn: (object: Metadata) => void): void;
		emit(event: "metadata", fn: (object: Metadata) => void): void;

		on(event: "ready", fn: () => void): void;
		off(event: "ready", fn: () => void): void;
		once(event: "ready", fn: () => void): void;
		emit(event: "ready", fn: () => void): void;

		on(event: "progress", fn: (msecs: number) => void): void;
		off(event: "progress", fn: (msecs: number) => void): void;
		once(event: "progress", fn: (msecs: number) => void): void;
		emit(event: "progress", fn: (msecs: number) => void): void;

		on(event: "error", fn: (err: Error) => void): void;
		off(event: "error", fn: (err: Error) => void): void;
		once(event: "error", fn: (err: Error) => void): void;
		emit(event: "error", fn: (err: Error) => void): void;

		on(event: "end", fn: () => void): void;
		off(event: "end", fn: () => void): void;
		once(event: "end", fn: () => void): void;
		emit(event: "end", fn: () => void): void;
	}

}