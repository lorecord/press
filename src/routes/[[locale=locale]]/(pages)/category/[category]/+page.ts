import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { awaitChecker } from '$lib/browser';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    await parent();
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