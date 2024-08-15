import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from "./$types";
import { getSystemConfig } from '$lib/server/config.js';
import { loadPostRaw } from '$lib/post/handle-posts';
import { saveWebmention, toWebmention } from '$lib/interaction/handle-webmention';
import { getRequestPayload } from '$lib/server/event-utils';

export const POST: RequestHandler = async ({ locals, request }) => {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    let payload: any = await getRequestPayload(request);

    const { source, target } = payload;

    const targetURL = new URL(target);
    let [, postRoute] = targetURL.pathname.match(/\/(.*)\//) || [];

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
    formDataForFetchBody.append('source', source);
    formDataForFetchBody.append('target', target);

    return await fetch(`https://webmention.io/${systemConfig.domains?.primary}/webmention`, {
        method: 'POST',
        // form data
        body: formDataForFetchBody
    });
}