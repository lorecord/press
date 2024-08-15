import { error, json } from '@sveltejs/kit';
import { getSystemConfig } from '$lib/server/config.js';
import { loadPostRaw } from '$lib/post/handle-posts';
import { saveWebmention, toWebmention } from '$lib/interaction/handle-webmention';

export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    const payloadSource = url.searchParams.get('source') as string;
    const payloadTarget = url.searchParams.get('target') as string;

    const target = new URL(payloadTarget);
    let [, postRoute] = target.pathname.match(/\/(.*)\//) || [];

    let postRaw = await loadPostRaw(site, { route: postRoute });
    if (!postRaw?.path) {
        let [lang, slug] = postRoute.split('/', 2);
        if (slug) {
            postRaw = await loadPostRaw(site, { route: slug, lang });
        }
        postRoute = slug;
    }

    if (!postRaw?.slug) {
        error(404);
    }

    const formDataForFetchBody = new FormData();
    formDataForFetchBody.append('source', payloadSource);
    formDataForFetchBody.append('target', payloadTarget);

    return await fetch(`https://webmention.io/${systemConfig.domains?.primary}/webmention`, {
        method: 'POST',
        // form data
        body: formDataForFetchBody
    });
}