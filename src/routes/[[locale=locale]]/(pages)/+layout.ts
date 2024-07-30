import type { Load } from '@sveltejs/kit';
import { locale } from '$lib/translations';
import { awaitChecker } from '$lib/browser';

/** @type {import('./$types').LayoutLoad} */
export const load: Load = async ({ fetch, params, depends, parent, data }) => {
    const { pathLocale, siteConfig, systemConfig } = await parent();

    depends('locale:locale');

    let posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'default|links',
        lang: locale.get()
    })}`)
        .then((r) => r.ok ? r.json() : []);

    const needAwait = awaitChecker();

    return { pathLocale, posts: needAwait ? await posts : posts, siteConfig, systemConfig };
}