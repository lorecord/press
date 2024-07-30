import { locale } from '$lib/translations';
import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    await parent();
    let { tag } = params;
    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
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