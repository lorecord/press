import { saveNativeInteraction } from '$lib/interaction/handle-native';
import type { NativeMention } from '$lib/interaction/types';
import { findLinkInContent } from '$lib/utils/content';
import crypto from 'crypto';
import xmlrpc from 'xmlrpc';
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const { site } = locals as any;
        const xml = await request.text();

        const server = xmlrpc.createServer();

        server.on('pingback.ping', async (err, params, callback) => {
            if (err) {
                callback({ faultCode: 1, faultString: 'Error processing request' });
                return;
            }

            const [sourceURI, targetURI] = params;

            if (!sourceURI || !targetURI) {
                callback({ faultCode: 2, faultString: 'Invalid sourceURI or targetURI' });
                return;
            }

            // validate sourceURI if it links to targetURI

            const headers = new Headers();
            headers.set('User-Agent', "XMLRPC");
            // add accept header
            headers.set('Accept', 'text/html, application/json, text/plain');
            let result = await fetch(sourceURI, { method: 'GET', headers }).then((response) => {
                if (response.ok) {
                    // check header is html or json or text
                    if (response.headers?.get('Content-Type')?.includes('text/html') || response.headers?.get('Content-Type')?.includes('application/json') || response.headers?.get('Content-Type')?.includes('text/plain')) {
                        return response.text().then((content) => {
                            return findLinkInContent(content, sourceURI, targetURI, response.headers?.get('Content-Type') || '');
                        });
                    }
                    return {
                        contentType: response.headers?.get('Content-Type')
                    } as any;
                } else {
                    if (response.status >= 400 && response.status < 500) {
                        // delete from the database
                        return {
                            valid: true,
                            contentType: response.headers?.get('Content-Type'),
                            deleted: true
                        }
                    }
                }
            });

            if (!result?.valid) {
                callback({ faultCode: 17, faultString: 'The sourceURI does not link to the targetURI' });
                return;
            }

            if (!result?.deleted) {
                // TODO author
                let mention: NativeMention = {
                    id: crypto.createHash('sha256').update(JSON.stringify({ source: sourceURI, target: targetURI })).digest('hex'),
                    channel: 'native',
                    url: sourceURI,
                    published: new Date().toISOString(),
                    type: 'mention',
                    title: result.title,
                };
                saveNativeInteraction(site,
                    { route: new URL(targetURI).pathname }, mention);
            }

            callback(null, 'Pingback received successfully');
        });

        server.httpRequestHandler(null, request, new Response(), xml);

        return new Response('Pingback processed', { status: 200 });
    } catch (error) {
        console.error('Pingback handling error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
};