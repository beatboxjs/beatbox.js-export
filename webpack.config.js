module.exports = (env, argv) => {

	const isDev = argv.mode == "development";

	const base = {
		entry: `${__dirname}/src/export.ts`,
		resolve: {
			extensions: [ ".js", ".ts" ]
		},
		mode: isDev ? "development" : "production",
		devtool: isDev ? "cheap-eval-source-map" : "source-map"
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
										],
										"@babel/preset-typescript"
									]
								}
							}
						]
					},
					{ test: /\.coffee$/, loader: "coffee-loader" }
				]
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
			externals: {
				"beatbox.js": {
					root: "Beatbox",
					commonjs: "beatbox.js",
					commonjs2: "beatbox.js",
					amd: "beatbox.js"
				}
			},
			module: {
				rules: [
					{
						resource: { and: [ /\.ts/, [
							__dirname + "/src/"
						] ] },
						use: [
							"ts-loader"
						]
					},
					{ test: /\.coffee$/, loader: "coffee-loader" }
				]
			}
		}
	];
};

