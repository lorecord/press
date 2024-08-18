import xmlrpc from 'xmlrpc';
import type { RequestHandler } from "./$types";
import { findLinkInContent } from '$lib/utils/content';

export const POST: RequestHandler = async ({ request }) => {
    try {
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

            // TODO validate sourceURI if it links to targetURI

            callback(null, 'Pingback received successfully');
        });

        server.httpRequestHandler(null, request, new Response(), xml);

        return new Response('Pingback processed', { status: 200 });
    } catch (error) {
        console.error('Pingback handling error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
};