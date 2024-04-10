import { error, json } from '@sveltejs/kit';
import { getSystemConfig } from '$lib/server/config.js';
import { loadPost } from '$lib/post/handle-posts';

export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    const payload = await request.json();

    if (systemConfig.webmention?.callback.secret !== payload.secret) {
        return new Response('{}', { status: 401 });
    }

    const postRoute = payload.target.replace(`${site.url}/`, '');

    const post = await loadPost(site, { route: postRoute, lang: undefined });

    if (!post) {
        return new Response('{}', { status: 404 });
    }

    if (!payload.deleted) {
        console.log('wm deleted');
        delete payload.secret;

        // TODO save payload to post
    } else {
        console.log('wm created');
    }

    if (!post || !post.content) {
        return new Response('{}', { status: 404 });
    }

    return json('ok');
}