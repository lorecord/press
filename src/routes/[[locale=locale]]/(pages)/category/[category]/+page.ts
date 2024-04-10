import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    await parent();
    let { category } = params;
    const posts = await fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
        category
    })}`).then((r) => r.json());

    let label = posts?.length
        ? posts[0].taxonomy?.category?.find((c: string) => c.toLowerCase() === category.toLowerCase())
        : category;

    if (!posts?.length) {
        error(404);
    }

    return { posts, category, label };
}