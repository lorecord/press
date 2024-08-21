import { getHrefWithRelValue } from '$lib/utils/html';
import { parse } from 'node-html-parser';

// 0. use 'Webmention' as HTTP User Agent
export const USER_AGENT = 'Webmention';

// https://www.w3.org/TR/webmention/#sender-discovers-receiver-webmention-endpoint
export const resolveEndpoint = async (url: string) => {
    if (!url || (new URL(url).protocol !== 'http:' && new URL(url).protocol !== 'https:')) {
        console.error(`[resolveEndpoint] invalid url: ${url}`);
        return null;
    }

    // TODO check cache headers (max-age or etag)

    const headers = new Headers();
    headers.set('User-Agent', USER_AGENT);

    return Promise.resolve().then(async () => {
        // 1. send head request to check if there is `link` header with 'rel' value 'webmention'
        return fetch(url, { method: 'HEAD', headers }).then((response) => {
            if (response.ok) {
                const link = response.headers.get('link');
                if (link) {
                    const links = link.split(',');
                    for (const l of links) {
                        const parts = l.split(';');
                        if (parts.length === 2) {
                            const url = parts[0].trim().replace(/^<(.*)>$/, '$1');
                            const rel = parts[1].trim().replace(/^rel="(.*)"/, '$1');
                            if (rel === 'webmention') {
                                return url;
                            }
                        }
                    }
                }
            }
            return null;
        }).then((endpoint) => {
            if (!endpoint) {
                // 2. get the content of the url, and check if there is a link tag with 'rel' value 'webmention',or a 'a' tag with 'rel' value 'webmention' in the content)

                // accept html/json/txt
                headers.set('Accept', 'text/html, application/json, text/plain');
                return fetch(url, { method: 'GET', headers }).then((response) => {
                    if (response.ok) {
                        return response.text();
                    }
                    return '';
                }).then((content) => {
                    return getHrefWithRelValue(content, 'webmention');
                });
            }
        }).then((endpoint) => {
            // 3. resolve the url if it is a relative url
            if (endpoint) {
                const endpointURL = new URL(endpoint, url);
                return endpointURL.href;
            }
        }).catch((error) => {
            console.error(`[resolveEndpoint] error: ${error}`);
            return null;
        });
    })
}

// https://www.w3.org/TR/webmention/#sender-notifies-receiver
export const sendWebmention = async ({ source, target }: { source: string, target: string }): Promise<{
    status: 'created' | 'aceppted' | 'done' | 'unsupported' | 'error';
    message?: string;
    location?: string;
}> => {

    return resolveEndpoint(target).then((endpoint) => {
        if (!endpoint) {
            return {
                status: 'unsupported'
            };
        }

        // Avoid sending Webmentions to localhost
        if (endpoint) {
            const endpointURL = new URL(endpoint);
            if (endpointURL.hostname === 'localhost') {
                console.warn('sending Webmentions to localhost');
            }
        }

        // send x-www-form-urlencoded request to the endpoint
        const headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
        headers.set('User-Agent', USER_AGENT);
        headers.set('Accept', 'application/json');

        const body = new URLSearchParams();
        body.append('source', source);
        body.append('target', target);

        return fetch(endpoint, { method: 'POST', headers, body }).then((response) => {
            console.log(`send webmention from ${source} to ${target} via ${endpoint}:`, response.status);
            // 200: done
            // 201: 'Location' header should be the url of processing status
            // 202: no processing status url

            // 2xx is success
            if (response.status >= 200 && response.status < 300) {
                let result: any = { source, target };
                if (response.status === 201) {
                    result['location'] = response.headers.get('Location');
                    result['status'] = 'created';
                } else if (response.status === 202) {
                    result['status'] = 'accepted';
                } else if (response.status === 200) {
                    result['status'] = 'done';
                }
                return result;
            }

            return response.text().then(text => ({
                status: 'error',
                message: `${response.status}: ${text}`
            }))
        });
    });
}