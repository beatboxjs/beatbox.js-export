import { defineConfig } from 'vite';
import dtsPlugin from 'vite-plugin-dts';
import { isAbsolute } from "node:path";

export default defineConfig({
	plugins: [
		dtsPlugin({ rollupTypes: true })
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
			external: (id) => !id.startsWith("./") && !id.startsWith("../") && /* resolved internal modules */ !isAbsolute(id)
		}
	},
	resolve: {
		alias: {
			'beatbox.js-export': '/src/export.ts'
		}
	}
});
