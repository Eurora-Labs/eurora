import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'@eurora/katex': path.resolve(
				__dirname,
				'../../packages/custom-components/katex/src/lib/index.ts',
			),
		},
	},
});
