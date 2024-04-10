import { locale } from '$lib/translations';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, parent }) {
    await parent();
    const posts = await fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get()
    })}`).then((r) => r.json());

    return { posts };
}