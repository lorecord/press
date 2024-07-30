import { browser } from '$app/environment';
import { awaitChecker } from '$lib/browser';
import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, parent }) {
    await parent();
    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get()
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