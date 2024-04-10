import { locale } from '$lib/translations';
import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    await parent();
    let { tag } = params;
    const posts = await fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
        tag
    })}`).then((r) => r.json());

    let label = posts?.length
        ? posts[0].taxonomy?.tag?.find((t: string) => t.toLowerCase() === tag.toLowerCase())
        : tag;

    if(!posts?.length){
        error(404);
    }

    return { posts, tag, label };
}