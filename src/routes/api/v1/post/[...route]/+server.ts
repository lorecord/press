import { error, json } from '@sveltejs/kit';
import { loadPost } from "$lib/post/handle-posts";
import { getPublicPosts, findRelatedPosts } from "$lib/server/posts";
import { getSystemConfig } from '$lib/server/config';

export async function GET({ params, url, locals }) {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    let { route } = params;
    if (route.endsWith('/')) {
        route = route.substring(0, route.length - 1);
    }
    let lang = url.searchParams.get('lang');
    if (!lang || lang === 'undefined' || lang === 'null') {
        lang = systemConfig.locale?.default || 'en';
    }
    const post = await loadPost(site, { route, lang: lang || undefined });

    if (!post || !post.published) {
        error(404);
    }

    if (post.deleted?.date) {
        error(410, { message: 'Post deleted', deleted: true } as any);
    }

    const posts = getPublicPosts(site);
    const postInCollection = posts.find((p: any) => p.route === post.route && p.lang === post.lang);

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