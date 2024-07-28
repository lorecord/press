import { browser } from '$app/environment';
import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, fetch, data }) => {
    const { pathLocale, siteConfig, systemConfig } = await parent();
    let posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
        limit: 8,
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const home = fetch(`/api/v1/post/home`).then((r) => r.json());

    return {
        home: browser ? home : await home,
        posts: browser ? posts : await posts, pathLocale, siteConfig, systemConfig
    };
} 