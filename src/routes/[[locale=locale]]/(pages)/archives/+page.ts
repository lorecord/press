import { awaitChecker } from '$lib/browser';
import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, depends, params, data }) => {
    depends('locale:locale');
    const { locale: localeParam } = params;
    const { localeContext } = data;
    let lang = localeParam || locale.get() || localeContext.contentLocale;
    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const needAwait = awaitChecker();

    return { posts: needAwait ? await posts : posts };
}