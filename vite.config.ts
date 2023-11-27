import { defineConfig } from 'vite';
import dtsPlugin from 'vite-plugin-dts';

export default defineConfig({
	plugins: [
		dtsPlugin()
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
		rollupOptions: {
			external: (id) => !id.startsWith("./") && !id.startsWith("../") && /* resolved internal modules */ !id.startsWith("/")
		}
	},
	resolve: {
		alias: {
			'beatbox.js-export': '/src/export.ts'
		}
	}
});
