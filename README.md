# beatbox.js-export

__beatbox.js-export__ allows exporting [beatbox.js](https://github.com/beatbox/beatbox.js)
patterns as MP3 or WAV files.

It relies on the following libraries:

* [lamejs](https://github.com/zhuker/lamejs) for MP3 encoding
* [wav-encoder](https://github.com/mohayonao/wav-encoder) for WAV encoding

## Usage

```javascript
import { Beatbox } from "beatbox.js";
import { exportMP3, exportWAV } from "beatbox.js-export";
import saveAs from "save-as";

// See beatbox.js documentation. Note that the "repeat" parameter is ignored in the context of exporting.
var player = new Beatbox(pattern, beatLength, repeat);

let blob = await exportMP3(player, (progress) => {
	// progress is a number between 0 and 1
});
saveAs(blob, "song.mp3");

blob = await exportWAV(player, (progress) => {
	// progress is a number between 0 and 1
});
saveAs(blob, "song.wav");
```

### Cancel

Returning `false` from the progress function will cancel the export and cause the export function to return `undefined`.

```javascript
let canceled = false;
document.getElementById("cancel-button").addEventListener("click", () => {
	canceled = true;
});

const blob = await exportMP3(player, (progress) => {
    if (canceled)
		return false;
});
if (blob)
	saveAs(blob, "song.mp3");
```

The progress function can also be async. In that case, the export will pause until the async function returns. You can
for example introduce some delays if you need some animation to run:

```javascript
await exportMP3(player, async (progress) => {
	await new Promise((resolve) => { setTimeout(resolve, 30); });
});
```

## Migrating from v1 to v2

* beatbox.js-export 2.x needs beatbox.js 2.x.
* Instead of injecting methods into the `Beatbox` class, beatbox.js-export now exports its own functions.
* beatbox.js-export 2.x does not use Aurora.js to decode audio files anymore, but uses the WebAudio API directly. This means that you don’t have to load a specific codec anymore, but rather use an audio format that the browser supports.
* The progress function can return `false` to cancel the export. It is not recommended to return a non-resolving promise anymore.