import { deleteWebmention, loadWebmentions, saveWebmention } from '$lib/interaction/handle-webmention';
import type { WebmentionInteraction } from '$lib/interaction/types';
import { loadPost } from '$lib/post/handle-posts';
import { getSiteConfig, getSystemConfig } from '$lib/server/config.js';
import { getRequestPayload } from '$lib/server/event-utils';
import { findLinkInContent } from '$lib/utils/content';
import { USER_AGENT } from '$lib/webmention';
import { error, json } from '@sveltejs/kit';
import crypto from 'crypto';
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, request }) => {
    const { site } = locals as { site: any };
    const siteConfig = getSiteConfig(site);
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

    if (post.webmention?.enabled === false || post.webmention?.accept === false) {
        error(400, "Specified target URL does not accept Webmentions");
    }

    const id = crypto.createHash('sha256').update(JSON.stringify({ source, target })).digest('hex');

    let existed = loadWebmentions(site, postRoute).find((interaction) => interaction.id === id || interaction.webmention?.source === source);

    if (existed?.status === 'pending') {
        return json({}, {
            status: 201,
            headers: {
                'Location': `${siteConfig.url}/api/v1/webmention/status/${id}`
            }
        });
    } else if (existed?.status === 'blocked' || existed?.status === 'spam') {
        return json({}, {
            status: 200,
        });
    }

    const headers = new Headers();
    headers.set('User-Agent', USER_AGENT);
    headers.set('Accept', 'text/html, application/json, text/plain');

    console.log('fetching and validating source', source);
    fetch(source, { method: 'GET', headers }).then((response) => {
        if (response.ok) {
            // check header is html or json or text
            if (response.headers?.get('Content-Type')?.includes('text/html') || response.headers?.get('Content-Type')?.includes('application/json') || response.headers?.get('Content-Type')?.includes('text/plain')) {
                return response.text().then((content) => {
                    return findLinkInContent(content, source, target, response.headers?.get('Content-Type') || '');
                });
            }
            return {
                contentType: response.headers?.get('Content-Type')
            } as any;
        } else {
            if ([401, 403, 404, 410, 451].includes(response.status)) {
                // delete from the database
                return {
                    valid: true,
                    contentType: response.headers?.get('Content-Type'),
                    deleted: true
                }
            }
            return {
                valid: false,
                contentType: response.headers?.get('Content-Type')
            } as any;
        }
    }).then((result) => {

        if (result?.valid && !result?.deleted) {
            let webmentionInteraction: WebmentionInteraction = {
                id,
                published: new Date().toISOString(),
                type: 'mention',
                channel: 'webmention',
                webmention: { source },
                status: 'ok',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            }
            saveWebmention(site, postRoute, webmentionInteraction);
        } if (result?.invalid && !result?.deleted) {
            deleteWebmention(site, postRoute, id);
        }
    }).catch((error) => {
        console.error('error', error)
    }).finally(() => {
        console.log('webmention validation completed');
    });

    let webmentionInteraction: WebmentionInteraction = {
        id,
        channel: 'webmention',
        webmention: { source },
        // TODO when prev status is pending, then a new mention update, this should be?
        status: 'pending',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    } as WebmentionInteraction;

    saveWebmention(site, postRoute, webmentionInteraction);

    //https://www.w3.org/TR/webmention/#receiving-webmentions
    return json({}, {
        status: 201,
        headers: {
            'Location': `${siteConfig.url}/api/v1/webmention/status/${id}`
        }
    });

    // if source status is 410 Gone, delete from the database

    // or async validate, json({ success: true }, {status: 202}) 
    // or json({ sucess: true}, {status: 200})

    // source URL not found.
    // source URL does not contain a link to the target URL.
}