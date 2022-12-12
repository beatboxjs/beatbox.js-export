import { defineConfig } from 'vite';
import dtsPlugin from 'vite-plugin-dts';
import autoExternalPlugin from 'rollup-plugin-auto-external';

export default defineConfig({
	plugins: [
		dtsPlugin(),
		autoExternalPlugin()
	],
	build: {
		sourcemap: true,
		minify: false,
		emptyOutDir: false,
		lib: {
			entry: `./src/export.ts`,
			fileName: () => `beatbox-export.js`,
			formats: ['es']
		},
	},
	resolve: {
		alias: {
			'beatbox.js-export': '/src/export.ts'
		}
	}
});
