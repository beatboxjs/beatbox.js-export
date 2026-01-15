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

## Upgrading

Check out the [changelog](./CHANGELOG.md) for notes about breaking changes.