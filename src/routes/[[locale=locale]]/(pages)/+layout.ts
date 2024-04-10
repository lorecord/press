import type { Load } from '@sveltejs/kit';
import { locale } from '$lib/translations';

/** @type {import('./$types').LayoutLoad} */
export const load: Load = async ({ fetch, params, depends, parent, data }) => {
    const { siteConfig, systemConfig } = await parent();

    depends('locale:locale');

    let posts = await fetch(`/api/v1/post?${new URLSearchParams({
        template: 'default|links',
        lang: locale.get()
    })}`)
        .then((r) => r.json());

    const ldjson: any = {
        '@context': 'https://schema.org',
    };

    if (siteConfig?.issn) {
        ldjson.issn = siteConfig?.issn;
    }

    return { posts, ldjson, siteConfig, systemConfig };
}