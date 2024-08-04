import { awaitChecker } from '$lib/browser';
import { locale } from '$lib/translations';
import { error } from "@sveltejs/kit";
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch, depends, data }) => {
    depends('locale:locale');
    const { localeContext } = data;
    const { tag, locale: localeParam } = params;
    let lang = localeParam || locale.get() || localeContext.contentLocale;
    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang,
        tag
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const needAwait = awaitChecker();

    return { tag, posts: needAwait ? await posts : posts };
}