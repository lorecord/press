import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.svx', '.md'],
			rehypePlugins: [
				rehypeExternalLinks,
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: 'prepend',
						properties: {
							className: ['header-link'],
							title: 'Permalink',
							ariaHidden: 'true'
						},
						content: {
							type: 'element',
							tagName: 'span',
							properties: {},
							children: [
								{
									type: 'text',
									value: '#'
								}
							]
						}
					}
				]
			]
		})
	],
	extensions: ['.svelte', '.md'],
	kit: {
		adapter: adapter()
	}
};

export default config;
