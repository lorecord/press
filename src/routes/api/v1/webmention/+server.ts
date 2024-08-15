import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from "./$types";
import { getSystemConfig } from '$lib/server/config.js';
import { loadPost } from '$lib/post/handle-posts';
import { deleteWebmention, saveWebmention } from '$lib/interaction/handle-webmention';
import { getRequestPayload } from '$lib/server/event-utils';
import type { WebmentionInteraction } from '$lib/interaction/types';
import crypto from 'crypto';
import { USER_AGENT } from '$lib/webmention';
import { parse } from 'node-html-parser';

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

    const id = crypto.createHash('sha256').update(JSON.stringify({ source, target })).digest('hex');

    const headers = new Headers();
    headers.set('User-Agent', USER_AGENT);
    // add accept header
    headers.set('Accept', 'text/html, application/json, text/plain');

    fetch(source, { method: 'GET', headers }).then((response) => {
        if (response.ok) {
            // check header is html or json or text
            if (response.headers?.get('Content-Type')?.includes('text/html') || response.headers?.get('Content-Type')?.includes('application/json') || response.headers?.get('Content-Type')?.includes('text/plain')) {
                response.text().then((content) => {

                    // if is html or json or text
                    if (response.headers?.get('Content-Type')?.includes('text/html')) {
                        // check if content contains a with href to target, or image with src to target, or a audio with src to target, or a video with src to target, or a source with src to target
                        const doc = parse(content);

                        const links = doc.querySelectorAll('a[href]');

                        const media = doc.querySelectorAll('img[src], audio[src], video[src], source[src]');

                        console.log('parsed', {
                            links, media
                        });

                        for (const a of links) {
                            console.log('a', a.rawAttrs, a.getAttribute('href'), target);
                            if (a.getAttribute('href') === target) {
                                return {
                                    valid: true,
                                    contentType: response.headers?.get('Content-Type'),
                                    type: 'link',
                                    responseText: content
                                };
                            }
                        }

                        for (const m of media) {
                            if (m.getAttribute('src') === target) {
                                return {
                                    valid: true,
                                    contentType: response.headers?.get('Content-Type'),
                                    type: 'media',
                                    responseText: content
                                };
                            }
                        }
                    } else if (response.headers?.get('Content-Type')?.includes('application/json')) {
                        // In a JSON ([RFC7159]) document, the receiver should look for properties whose values are an exact match for the URL.
                        const json = JSON.parse(content);

                        function findAttributeValue(obj: any, value: any) {
                            for (const key in obj) {
                                if (obj[key] === value) {
                                    return true;
                                }
                                if (typeof obj[key] === 'object') {
                                    if (findAttributeValue(obj[key], value)) {
                                        return true;
                                    }
                                } else if (Array.isArray(obj[key])) {
                                    for (const item of obj[key]) {
                                        if (findAttributeValue(item, value)) {
                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        }

                        if (findAttributeValue(json, target)) {
                            return {
                                valid: true,
                                contentType: response.headers?.get('Content-Type'),
                                responseText: content
                            };
                        }

                    } else if (response.headers?.get('Content-Type')?.includes('text/plain')) {
                        // If the document is plain text, the receiver should look for the URL by searching for the string
                        if (content.match(new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`))) {
                            return {
                                valid: true,
                                contentType: response.headers?.get('Content-Type'),
                                responseText: content
                            };
                        };
                    } else {
                        return {
                            contentType: response.headers?.get('Content-Type'),
                            responseText: content
                        };
                    }
                });
            }
            return {
                contentType: response.headers?.get('Content-Type')
            } as any;
        } else {
            if (response.status === 410) {
                // delete from the database
                return {
                    valid: true,
                    contentType: response.headers?.get('Content-Type'),
                    deleted: true
                }
            }
        }
    }).then((result) => {
        console.log('result of validation', result);

        if (result?.valid && !result?.deleted) {
            let webmentionInteraction: WebmentionInteraction = {
                id,
                published: new Date().toISOString(),
                type: 'mention',
                channel: 'webmention',
                webmention: { source }
            }
            saveWebmention(site, post, webmentionInteraction);
        } if (result?.invalid && !result?.deleted) {
            deleteWebmention(site, post, id);
        }
    });



    //https://www.w3.org/TR/webmention/#receiving-webmentions
    return json({}, {
        status: 201,
        headers: {
            'Location': `${systemConfig.domains.primary}/api/v1/webmention/status/${id}`
        }
    });

    // if source status is 410 Gone, delete from the database

    // or async validate, json({ success: true }, {status: 202}) 
    // or json({ sucess: true}, {status: 200})

    // source URL not found.
    // source URL does not contain a link to the target URL.
}