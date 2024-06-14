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
    })}`).then((r) => r.json());

    let label = posts?.length
        ? posts[0].taxonomy?.series?.find((t: string) => t.toLowerCase() === series.toLowerCase())
        : series;

    if(!posts?.length){
        error(404);
    }

    return { posts, series, label };
}