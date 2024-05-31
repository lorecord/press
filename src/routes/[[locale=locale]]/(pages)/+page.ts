import { locale } from '$lib/translations';

/** @type {import('./$types').PageLoad} */
export async function load({ params, parent, fetch, data }) {
    const { pathLocale, siteConfig, systemConfig } = await parent();
    let posts = await fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
        limit: 8,
    })}`).then((r) => r.json());

    return { posts, pathLocale, siteConfig, systemConfig };
}