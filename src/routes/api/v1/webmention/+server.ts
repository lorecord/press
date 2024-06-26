import { error, json } from '@sveltejs/kit';
import { getSystemConfig } from '$lib/server/config.js';
import { loadPost } from '$lib/post/handle-posts';
import { saveWebmention } from '$lib/interaction/handle-webmention.js';

export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    const source = url.searchParams.get('source') as string;
    const target = url.searchParams.get('target') as string;

    const postRoute = target.replace(`${site.url}/`, '');

    const post = await loadPost(site, { route: postRoute, lang: undefined });

    if (!post) {
        return new Response('{}', { status: 404 });
    }

    // TODO start verifying source

    saveWebmention(site, postRoute, { source, target });

    console.log('wm created');

    return json('ok');
}