import { error, json } from '@sveltejs/kit';
import { getSystemConfig } from '$lib/server/config.js';
import { loadPost } from '$lib/post/handle-posts';

export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    const source = url.searchParams.get('source');
    const target = url.searchParams.get('target') as string;

    const postRoute = target.replace(`${site.url}/`, '');

    const post = await loadPost(site, { route: postRoute, lang: undefined });

    if (!post) {
        return new Response('{}', { status: 404 });
    }

    // TODO save payload to post

    console.log('wm created');

    return json('ok');
}