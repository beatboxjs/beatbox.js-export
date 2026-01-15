# Changelog

## v5.0.0

* The dependencies have been upgraded to beatbox.js v5

## v4.0.0

* **Breaking:** beatbox.js-export 4.x changes the signature of the second argument of the export functions. Rather than taking a
progress callback, it now takes an object with an optional `onProgress` and `signal` property.
* **Breaking:** The return value of the progress callback is now ignored, so it cannot be used to cancel or delay the export anymore. To cancel the export, the abort signal can now be used.

## v3.0.0

* **Breaking:** beatbox.js-export 3.x exports an ES module instead of a UMD bundle. This means that to use it, you need to use a browser or bundler with ESM support.

## v2.0.0

* **Breaking:** beatbox.js-export 2.x needs beatbox.js 2.x.
* **Breaking:** Instead of injecting methods into the `Beatbox` class, beatbox.js-export now exports its own functions.
* **Breaking:** beatbox.js-export 2.x does not use Aurora.js to decode audio files anymore, but uses the WebAudio API directly. This means that you don’t have to load a specific codec anymore, but rather use an audio format that the browser supports.
* **Breaking:** The progress function can return `false` to cancel the export. It is not recommended to return a non-resolving promise anymore.