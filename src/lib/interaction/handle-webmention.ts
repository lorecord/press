import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { loadPostRaw } from '$lib/post/handle-posts';
import type { WebmentionReply } from './types';
import Crypto from 'crypto';
import { getSiteConfig } from '$lib/server/config';
import { getInteractionsFoler } from './utils';
import { parse } from 'node-html-parser';

export function getWebmentionPathOfSource(site: any, postPath: string) {
    const folder = getInteractionsFoler(site, { slug: postPath });
    if (folder) {
        return path.join(folder, 'webmention/source.yml');
    }
}

export function loadWebmentions(site: any, postPath: string) {
    const filepath = getWebmentionPathOfSource(site, postPath);

    if (!filepath) {
        return [];
    }

    if (!fs.existsSync(filepath)) {
        return [];
    }
    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    return parsed.map((mention: any) => {
        const webmentionReply: WebmentionReply = {
            id: Crypto.createHash('sha256').update(JSON.stringify({
                source: mention.source,
                target: mention.target
            })).digest('hex'),
            published: mention.post?.published,
            channel: 'webmention',
            webmention: {
                source: mention.source
            },
            url: mention.source,
            type: 'reply',
            content: mention.post.name,
            author: {
                name: mention.post.author.name,
                url: mention.post.author.url,
                avatar: mention.post.author.photo
            }
        }
        return webmentionReply;
    });
}

export function saveWebmention(site: any, postPath: string, mention: any) {
    const filepath = getWebmentionPathOfSource(site, postPath);

    if (!filepath) {
        return;
    }

    let mentions = [];

    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
    } else {
        mentions = loadWebmentions(site, postPath);
    }

    mentions = mentions.filter((m: any) => m.source !== mention.source);
    mentions.push(mention);
    let data = YAML.stringify(mentions);
    fs.writeFileSync(filepath, data, 'utf8');
}

export function deleteWebmention(site: any, postPath: string, mention: any) {
    const filepath = getWebmentionPathOfSource(site, postPath);

    if (!filepath) {
        return;
    }

    let mentions = loadWebmentions(site, postPath);
    mentions = mentions.filter((m: any) => m.source !== mention.source);

    let data = YAML.stringify(mentions);
    fs.writeFileSync(filepath, data, 'utf8');
}

// https://www.w3.org/TR/webmention/#sender-discovers-receiver-webmention-endpoint
const resolveEndpoint = async (url: string) => {
    // 0. use 'Webmention' as HTTP User Agent
    const userAgent = 'Webmention';
    const headers = new Headers();
    headers.set('User-Agent', userAgent);

    // 1. send head request to check if there is `link` header with 'rel' value 'webmention'

    // 2. get the content of the url, and check if there is a link tag with 'rel' value 'webmention',or a 'a' tag with 'rel' value 'webmention' in the content)

    // 3. resolve the url if it is a relative url

    return Promise.resolve().then(() => {
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
                return fetch(url, { method: 'GET', headers }).then((response) => {
                    if (response.ok) {
                        return response.text();
                    }
                    return '';
                }).then((content) => {
                    const doc = parse(content);
                    const links = doc.querySelectorAll('link[rel="webmention"]');
                    for (const link of links) {
                        return link.getAttribute('href');
                    }
                    const as = doc.querySelectorAll('a[rel="webmention"]');
                    for (const a of as) {
                        return a.getAttribute('href');
                    }
                });
            }
        });
    })
}

// https://www.w3.org/TR/webmention/#sender-notifies-receiver
export async function sendWebmention({ source, target }: { source: string, target: string }) {
    return resolveEndpoint(target).then((endpoint) => {
        if (!endpoint) {
            return;
        }
        // send x-www-form-urlencoded request to the endpoint
        const headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
        headers.set('User-Agent', 'Webmention');

        const body = new URLSearchParams();
        body.append('source', source);
        body.append('target', target);

        return fetch(endpoint, { method: 'POST', headers, body }).then((response) => {
            // 200: done
            // 201: 'Location' header should be the url of processing status
            // 202: no processing status url

            // 2xx is success
            if (response.status >= 200 && response.status < 300) {
                let result: any = { source, target };
                if (response.status === 201) {
                    result['location'] = response.headers.get('Location');
                    result['status'] = 'processing';
                }

                result.updated = new Date().toISOString();
                return response;
            }
        });
    });
}

export function sendWebmentions(site: any, postPath: string, targets: string[]) {
    const siteConfig = getSiteConfig(site, 'en');
    const folder = getInteractionsFoler(site, { slug: postPath });
    if (!folder) {
        return;
    }
    const filepath = path.join(folder, 'webmention/target.yml');

    const postRaw = loadPostRaw(site, { route: postPath, lang: 'en' });
    if (!postRaw) {
        return;
    }

    let mentions: any = [];

    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(folder, { recursive: true });
    } else {
        mentions = loadWebmentions(site, postPath);
    }

    const tasks = [];
    for (const target of targets) {
        let mention = mentions.find((m: any) => m.target === target);
        if (mention) {
            if (mention?.updated && new Date().getTime() - new Date(mention.updated).getTime() < 1000 * 60 * 60 * 24 * 1) {
                continue;
            }
        } else {
            mention = { target };
            mentions.push({ target });
        }

        const resultPromise = sendWebmention({ source: siteConfig.url + postRaw.url, target }).then(result => {
            Object.assign(mention, result);
            return mention;
        });
        tasks.push(resultPromise);
    }
    Promise.all(tasks).then((results) => {
        let data = YAML.stringify(mentions);
        fs.writeFileSync(filepath, data, 'utf8');
    });
}