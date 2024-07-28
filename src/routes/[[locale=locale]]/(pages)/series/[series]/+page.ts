import { browser } from '$app/environment';
import { locale } from '$lib/translations';
import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    await parent();
    let { series } = params;
    const posts = await fetch(`/api/v1/post?${new URLSearchParams({
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

    return { series, posts: browser ? posts : await posts };
}