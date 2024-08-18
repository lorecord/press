import { sveltekit } from '@sveltejs/kit/vite';
// @ts-ignore
import importableYAML from '@importable/yaml/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), importableYAML()],
	optimizeDeps: {
		exclude: ['src/lib/server/worker/bing.worker.js', '@tabler/icons-svelte']
	}
};

export default config;
