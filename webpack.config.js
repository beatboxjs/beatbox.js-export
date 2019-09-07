const nodeExternals = require('webpack-node-externals');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => {

	const isDev = argv.mode == "development";

	const base = {
		entry: `${__dirname}/src/export.ts`,
		resolve: {
			extensions: [ ".js", ".ts" ]
		},
		mode: isDev ? "development" : "production",
		devtool: isDev ? "cheap-eval-source-map" : "source-map",
		module: {
			rules: [
				{
					resource: { and: [ /\.ts/, [
						__dirname + "/src/"
					] ] },
					use: [
						{
							loader: "babel-loader",
							options: {
								presets: [
									[
										"@babel/preset-env",
										{
											useBuiltIns: "usage",
											corejs: 3
										}
									]
								]
							}
						},
						"ts-loader"
					]
				},
				{ test: /\.coffee$/, loader: "coffee-loader" }
			]
		}
	};

	return [
		{
			...base,
			name: "demo",
			output: {
				filename: "beatbox-export.js",
				path: __dirname + "/demo/"
			},
			externals: {
				"beatbox.js": "Beatbox"
			},
			devServer: {
				publicPath: "/demo/"
			}
		},
		{
			...base,
			name: "umd",
			output: {
				filename: "beatbox-export.js",
				path: __dirname + "/dist/",
				libraryTarget: "umd"
			},
			externals: [ nodeExternals() ],
			plugins: [
				//new BundleAnalyzerPlugin()
			]
		}
	];
};

