import nodeExternals from "webpack-node-externals";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { Configuration } from "webpack";

export default (env: any, argv: any): Configuration[] => {

	const isDev = argv.mode == "development";

	const base: Configuration = {
		entry: `${__dirname}/src/export.ts`,
		resolve: {
			extensions: [ ".js", ".ts" ]
		},
		mode: isDev ? "development" : "production",
		devtool: isDev ? "eval-cheap-source-map" : "source-map",
		module: {
			rules: [
				{
					resource: { and: [/\.ts/, [__dirname + "/src/"]] },
					use: [
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
				publicPath: "/demo/",
				injectClient: false, // https://github.com/webpack/webpack-dev-server/issues/2484
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

