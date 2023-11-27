# beatbox.js-export

__beatbox.js-export__ allows exporting [beatbox.js](https://github.com/beatbox/beatbox.js)
patterns as MP3 or WAV files.

It relies on the following libraries:

* [wasm-media-encoders](https://github.com/arseneyr/wasm-media-encoders) for MP3 encoding
* [wav-encoder](https://github.com/mohayonao/wav-encoder) for WAV encoding

## Usage

```javascript
import { Beatbox } from "beatbox.js";
import { exportMP3, exportWAV } from "beatbox.js-export";
import saveAs from "save-as";

// See beatbox.js documentation. Note that the "repeat" parameter is ignored in the context of exporting.
var player = new Beatbox(pattern, beatLength, repeat);

let blob = await exportMP3(player);
saveAs(blob, "song.mp3");

blob = await exportWAV(player);
saveAs(blob, "song.wav");
```

### Progress

An optional `onProgress` callback can be passed to track the progress:
```javascript
let blob = await exportMP3(player, {
	onProgress: (progress) => {
		// Progress is a number between 0 and 1
		console.log(progress);
	}
});
```

### Abort

You can pass an abort signal to cancel the export. This will cause the export function to throw the signal cause.

```javascript
const abortController = new AbortController();
document.getElementById("cancel-button").addEventListener("click", () => {
	abortController.abort();
});

try {
	const blob = await exportMP3(player, { signal });
	saveAs(blob, "song.mp3");
} catch (err) {
	if (err instanceof DOMException && err.name === "AbortError") {
		// Ignore
	}

	throw err;
}
```

## Migrating from v3 to v4

beatbox.js-export 4.x changes the signature of the second argument of the export functions. Rather than taking a
progress callback, it now takes an object with an optional `onProgress` and `signal` property.

The return value of the progress callback is now ignored, so it cannot be used to cancel or delay the export anymore.
To cancel the export, the abort signal can now be used.

## Migrating from v2 to v3

beatbox.js-export 3.x exports an ES module instead of a UMD bundle. This means that to use it, you need to use a browser or bundler with ESM support.

## Migrating from v1 to v2

* beatbox.js-export 2.x needs beatbox.js 2.x.
* Instead of injecting methods into the `Beatbox` class, beatbox.js-export now exports its own functions.
* beatbox.js-export 2.x does not use Aurora.js to decode audio files anymore, but uses the WebAudio API directly. This means that you don’t have to load a specific codec anymore, but rather use an audio format that the browser supports.
* The progress function can return `false` to cancel the export. It is not recommended to return a non-resolving promise anymore.