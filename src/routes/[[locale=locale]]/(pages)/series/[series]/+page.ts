import { awaitChecker } from '$lib/browser';
import { locale } from '$lib/translations';
import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    await parent();
    let { series } = params;
    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
        series
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const needAwait = awaitChecker();

    return { series, posts: needAwait ? await posts : posts };
}