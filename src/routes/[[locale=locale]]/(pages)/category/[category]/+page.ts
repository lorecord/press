import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import { awaitChecker } from '$lib/browser';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch, depends }) => {
    depends('locale:locale');
    let { category } = params;
    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
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