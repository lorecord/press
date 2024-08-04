import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import { awaitChecker } from '$lib/browser';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch, depends, data }) => {
    depends('locale:locale');

    const { category, locale: localeParam } = params;
    const { localeContext } = data;
    let lang = localeParam || locale.get() || localeContext.contentLocale;
    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang,
        category
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const needAwait = awaitChecker();

    return { category, posts: needAwait ? await posts : posts };
}