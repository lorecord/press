import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { awaitChecker } from '$lib/browser';

export const load: PageLoad = async ({ depends, fetch, params, data }) => {
    const { locale: pathLocaleParam } = params;
    const { localeContext } = data;
    depends('locale:locale');
    let posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: pathLocaleParam || locale.get() || localeContext.contentLocale,
        limit: '8',
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const home = fetch(`/api/v1/post/home${locale.get() ? '?' + new URLSearchParams({
        lang: pathLocaleParam || locale.get()
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json();
        }
    });

    const needAwait = awaitChecker();

    return {
        home: needAwait ? await home : home,
        posts: needAwait ? await posts : posts
    };
} 