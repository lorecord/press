import type { Load } from '@sveltejs/kit';
import { locale } from '$lib/translations';
import { browser } from '$app/environment';

/** @type {import('./$types').LayoutLoad} */
export const load: Load = async ({ fetch, params, depends, parent, data }) => {
    const { pathLocale, siteConfig, systemConfig } = await parent();

    depends('locale:locale');

    let posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'default|links',
        lang: locale.get()
    })}`)
        .then((r) => r.json());

    return { pathLocale, posts: browser ? posts : await posts, siteConfig, systemConfig };
}