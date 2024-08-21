import { getSiteConfig } from "$lib/server/config";
import type { Site } from "$lib/server/sites";
import { getHrefWithRelValue } from "$lib/utils/html";
import fs from 'fs';
import path from "path";
import YAML from "yaml";
import { getInteractionsFoler } from "./utils";
import { dev } from "$app/environment";

export function getPingbackPath(site: Site, postPath: string) {
    const folder = getInteractionsFoler(site, { route: postPath });
    if (folder) {
        return path.join(folder, 'pingback/target.yml');
    }
}

export function loadPingbacks(site: Site, postPath: string) {
    const filepath = getPingbackPath(site, postPath);
    if (!filepath) {
        return [];
    }

    if (!fs.existsSync(filepath)) {
        return [];
    }
    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);
    return parsed || [];
}

export async function sendPingbacks(site: Site, postPath: string, targetURIs: string[], postUpdated: Date) {
    if (dev) {
        console.log(`[pingback] sending pingbacks from ${postPath}`, targetURIs);
    }
    if ((targetURIs?.length || 0) === 0) {
        if (dev) {
            console.log(`[pingback] no target URIs to send pingbacks from ${postPath}`, targetURIs?.length);
        }
        return;
    }

    const siteConfig = getSiteConfig(site, 'en');
    const filepath = getPingbackPath(site, postPath);

    if (!filepath) {
        console.error('Pingback target.yml path not found');
        return;
    }

    let pingbacks: any[] = [];

    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
    } else {
        pingbacks = loadPingbacks(site, postPath);
    }

    const tasks = [];

    for (const targetURI of targetURIs) {
        let pingback = pingbacks.find((p) => p.targetURI === targetURI);
        if (pingback) {
            if (pingback?.updated && new Date(pingback.updated) >= postUpdated) {
                if (dev) {
                    console.log(`[pingback] skip sending pingback to ${targetURI}`);
                }
                continue;
            }
        } else {
            pingback = {
                targetURI
            };
            pingbacks.push(pingback);
        }

        const resultPromise = sendPingback(siteConfig.url + postPath + '/', targetURI).then((result) => {
            if (dev) {
                console.log(`[pingback] sent pingback to ${targetURI}`, result);
            }
            Object.assign(pingback, result);
            pingback.updated = new Date().toISOString();
            if (!result) {
                pingback.status = 'error';
                if (dev) {
                    console.error(`[pingback] error sending pingback to ${targetURI}`, result);
                }
            }
            return pingback;
        })

        tasks.push(resultPromise);
    }

    if (dev) {
        console.log(`[pingback] sending ${tasks.length} pingbacks from ${postPath}`);
    }

    return Promise.all(tasks).then((results) => {
        if ((results?.length || 0) > 0) {
            console.log(`[pingback] sent ${results.length} pings from ${postPath}`, JSON.stringify(results, null, 2));
        }
        const filepath = getPingbackPath(site, postPath);
        if (!filepath) {
            console.error('Pingback target.yml path not found');
            return;
        }
        let data = YAML.stringify(pingbacks);
        fs.writeFileSync(filepath, data, 'utf8');
        return pingbacks;
    })
}

export async function sendPingback(sourceURI: string, targetURI: string) {
    const xmlRequest = createPingbackRequest(sourceURI, targetURI);

    return resolveEndpoint(targetURI).then((endpoint) => {
        if (!endpoint) {
            console.error(`Pingback endpoint not found for ${targetURI}`);
            return {
                status: 'unsupported',
            }
        }

        if (dev) {
            console.log(`[pingback] endpoint of ${targetURI} is `, endpoint);
        }
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
            },
            body: xmlRequest,
        }).then((response) => {
            if (response.ok) {
                return { status: 'done' };
            } else {
                return response.text().then((text) => {
                    return {
                        status: 'error',
                        message: `${response.status}: ${text}`
                    };
                });
            }
        });
    });
}

async function resolveEndpoint(url: string) {
    return fetch(url, {
        method: 'HEAD',
    }).then((response) => {
        if (response.ok) {
            // check the header 'X-Pingback'
            if (response.headers.has('X-Pingback')) {
                return response.headers.get('X-Pingback');
            }
            // check link header with rel="pingback"
            const link = response.headers.get('Link');
            if (link) {
                const links = link.split(',');
                const pingbackLink = links.find((l) => l.includes('rel="pingback"'));
                if (pingbackLink) {
                    return pingbackLink.split(';')[0].trim().slice(1, -1);
                }
            }
        }
    }).then((endpoint) => {
        if (!endpoint) {
            return fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': "XMLRPC",
                    'Accept': 'text/html, application/json, text/plain'
                }
            }).then((response) => {
                if (response.ok) {
                    return response.text().then((content) => {
                        return getHrefWithRelValue(content, 'pingback');
                    });
                }
            });
        }
    }).then((endpoint) => {
        if (endpoint) {
            const endpointURL = new URL(endpoint, url);
            return endpointURL.href;
        }
    });
}

function createPingbackRequest(sourceURI: string, targetURI: string) {
    const request = `
      <methodCall>
        <methodName>pingback.ping</methodName>
        <params>
          <param>
            <value><string>${sourceURI}</string></value>
          </param>
          <param>
            <value><string>${targetURI}</string></value>
          </param>
        </params>
      </methodCall>
    `;
    return request.trim();
}
