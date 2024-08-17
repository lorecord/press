import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends, fetch, params, data }) => {
    const { locale: pathLocaleParam } = params;
    const { localeContext } = data;
    depends('locale:locale');
    let posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: pathLocaleParam || locale.get() || localeContext.contentLocale,
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    return {
        posts
    };
} 