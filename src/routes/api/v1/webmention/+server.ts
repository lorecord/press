import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from "./$types";
import { getSystemConfig } from '$lib/server/config.js';
import { loadPost } from '$lib/post/handle-posts';
import { saveWebmention } from '$lib/interaction/handle-webmention';
import { getRequestPayload } from '$lib/server/event-utils';
import type { WebmentionInteraction } from '$lib/interaction/types';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ locals, request }) => {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    let payload: any = await getRequestPayload(request);

    const { source, target } = payload;

    // https://www.w3.org/TR/webmention/#request-verification-p-3
    if (source === target) {
        error(406);
    }

    const sourceURL = new URL(source);

    if (sourceURL.protocol !== 'https:' && sourceURL.protocol !== 'http:') {
        error(400, "source URL was malformed or is not a supported URL scheme (e.g. a mailto: link)")
    }

    const targetURL = new URL(target);
    let [, lang, postRoute] = targetURL.pathname.match(/\/(?:([a-z]{2}(?:-[a-zA-Z]{2,5})?)?\/)?(.*)\//) || [];

    const post = await loadPost(site, { route: postRoute, lang });

    if (!post) {
        error(404, "Specified target URL not found");
    }

    if (post.webmention?.enabled === false) {
        error(400, "Specified target URL does not accept Webmentions");
    }

    let webmentionInteraction: WebmentionInteraction = {
        id: crypto.createHash('sha256').update(JSON.stringify({ source, target })).digest('hex'),
        published: new Date().toISOString(),
        type: 'reply',
        channel: 'webmention',
        webmention: { source }
    }
    saveWebmention(site, post, webmentionInteraction);

    //https://www.w3.org/TR/webmention/#receiving-webmentions
    return json({}, {
        status: 201,
        headers: {
            'Location': `${systemConfig.domains.primary}/api/v1/webmention/status/${webmentionInteraction.id}`
        }
    });

    // if source status is 410 Gone, delete from the database

    // or async validate, json({ success: true }, {status: 202}) 
    // or json({ sucess: true}, {status: 200})

    // source URL not found.
    // source URL does not contain a link to the target URL.
}