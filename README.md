__beatbox.js-export__ adds the functionality to [beatbox.js](https://github.com/beatbox/beatbox.js)
to export the song in different formats.

It relies on the following libraries:

* [aurora.js](https://github.com/audiocogs/aurora.js) for sample decoding
* [libmp3lame-js](https://github.com/akrennmair/libmp3lame-js) for MP3 encoding
* [wav-encoder](https://github.com/mohayonao/wav-encoder) for WAV encoding

Usage
=====

Depending on what sample formats, you are using, make sure to load the respective
aurora.js decoder (by simply loading the [FLAC.js](https://github.com/audiocogs/flac.js/releases),
[ALAC.js](https://github.com/audiocogs/alac.js/releases), [MP3.js](https://github.com/audiocogs/mp3.js/releases) or
[AAC.js](https://github.com/audiocogs/aac.js) JavaScript file into your page).

```javascript
var player = new Beatbox(pattern, beatLength, repeat); // See beatbox.js documentation

player.exportMP3(function(blob) {
	saveAs(blob, "song.mp3");
}, function(progress) {
	// progress is a number between 0 and 1
});

player.exportWAV(function(blob) {
	saveAs(blob, "song.wav");
}, function(progress) {
	// progress is a number between 0 and 1
});
```

Demo
====

To run the demo, run the following commands:

```bash
bower install
bower install FileSaver
bower install mp3=https://github.com/audiocogs/mp3.js/releases/download/v0.1.0/mp3.js
cd bower_components/beatbox
bower install
```

Then open the file `demo/demo.html` in your browser.