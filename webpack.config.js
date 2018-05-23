module.exports = {
	entry: [ "babel-polyfill", "mp3", `${__dirname}/src/export.js` ],
	output: {
		filename: "beatbox-export.js",
		path: __dirname + "/demo/"
	},
	module: {
		rules: [
			{ test: require.resolve("beatbox.js"), loader: "expose-loader?Beatbox" },
			{ test: require.resolve("howler"), loader: "expose-loader?howler" },
			{
				test: [
					__dirname + "/src/",
					__dirname + "/node_modules/beatbox.js/"
				],
				loader: "babel-loader?presets=env"
			},
			{ test: /\.coffee$/, loader: "coffee-loader" },
		]
	},
	mode: "production",
	devtool: "source-map"
};
