import { json } from '@sveltejs/kit';
import { loadPost } from "$lib/post/handle-posts";
import { getPublicPosts, findRelatedPosts } from "$lib/server/posts";

export async function GET({ params, url, locals }) {
    const { site } = locals as { site: any };

    let { route } = params;
    if (route.endsWith('/')) {
        route = route.substring(0, route.length - 1);
    }
    const lang = url.searchParams.get('lang');
    const post = await loadPost(site, { route, lang: lang || undefined });

    if (!post || !post.published) {
        return new Response('{}', { status: 404 });
    }

    if (post.deleted) {
        return new Response('{ deleted: true }', { status: 410 });
    }

    const posts = getPublicPosts(site);
    const postInCollection = posts.find((p: any) => p.slug === post.slug);

    if (postInCollection) {
        post.earlier = postInCollection.earlier;
        post.newer = postInCollection.newer;
    }

    if (post.template == "item") {
        const related = findRelatedPosts(site, post, 5);
        post.related = related;
    }

    return json(post);
}