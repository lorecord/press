import { getSiteConfig } from '$lib/server/config';
import type { Site } from '$lib/server/sites';
import { sendWebmention } from '$lib/webmention';
import Crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import type { WebmentionInteraction } from './types';
import { getInteractionsFoler } from './utils';

export function getWebmentionPathOfTarget(site: any, postPath: string) {
    const folder = getInteractionsFoler(site, { route: postPath });
    if (folder) {
        return path.join(folder, 'webmention/target.yml');
    }
}

export function getWebmentionPathOfSource(site: any, postPath: string) {
    const folder = getInteractionsFoler(site, { route: postPath });
    if (folder) {
        return path.join(folder, 'webmention/source.yml');
    }
}

export function loadPublishedWebmentions(site: Site, postPath: string) {
    let webmentions = loadWebmentions(site, postPath);
    return webmentions.filter((mention) => mention.status === 'ok');
}

export function loadOutWebmentions(site: Site, postPath: string) {
    const filepath = getWebmentionPathOfTarget(site, postPath);
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

export function loadWebmentions(site: any, postPath: string): WebmentionInteraction[] {
    const filepath = getWebmentionPathOfSource(site, postPath);

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

export function fromWebmentionIO(payload: any): WebmentionInteraction {
    const wmProperty = payload.post && payload.post['wm-property'];

    let type = ({
        'in-reply-to': 'reply',
        'like-of': 'like',
        'repost-of': 'repost',
        'bookmark-of': 'bookmark',
        'mention-of': 'mention'
    }[wmProperty as string] || 'reply') as WebmentionInteraction['type'];

    const webmentionInteraction: WebmentionInteraction = {
        id: Crypto.createHash('sha256').update(JSON.stringify({
            source: payload.source,
            target: payload.target
        })).digest('hex'),
        published: payload.post?.published,
        channel: 'webmention',
        webmention: { ...payload, status: 'ok' },
        url: payload.source,
        type,
        content: payload.post?.name,
        title: payload.post?.name,
        author: {
            name: payload.post?.author?.name,
            url: payload.post?.author?.url,
            avatar: payload.post?.author?.photo,
            verified: true
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
    return webmentionInteraction;
}

export function saveWebmention(site: any, postPath: string, mention: WebmentionInteraction) {
    const filepath = getWebmentionPathOfSource(site, postPath);

    console.debug('[webmention] saving Webmention', postPath, filepath, mention);
    if (!filepath) {
        return;
    }

    let mentions: WebmentionInteraction[] = [];

    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
    } else {
        mentions = loadWebmentions(site, postPath);
    }

    let existed = mentions.find(m => m.webmention.source === mention.webmention.source);

    mentions = mentions.filter(m => m.webmention.source !== mention.webmention?.source);

    if (existed) {
        mention.created = existed.created || mention.created || new Date().toISOString();
    }

    mentions.push(Object.assign({}, existed || {}, mention));

    let data = YAML.stringify(mentions);
    fs.writeFileSync(filepath, data, 'utf8');
    console.log(`[webmention] saved ${filepath}: ${mention.webmention.source} to ${postPath}`);
}

export function deleteWebmention(site: any, postPath: string, source: string) {
    const filepath = getWebmentionPathOfSource(site, postPath);

    if (!filepath) {
        return;
    }

    let mentions = loadWebmentions(site, postPath);
    let existed = mentions.find(m => m.webmention.source === source);
    if (!existed) {
        return;
    }
    existed.updated = new Date().toISOString();
    existed.webmention.status = 'deleted';
    let data = YAML.stringify(mentions);
    fs.writeFileSync(filepath, data, 'utf8');
}

export function sendWebmentions(site: any, postPath: string, targets: string[], postUpdated: Date) {
    const siteConfig = getSiteConfig(site, 'en');

    const filepath = getWebmentionPathOfTarget(site, postPath);

    if (!filepath) {
        console.error(`[webmention] can't find webmention target file path for ${postPath}`);
        return Promise.resolve();
    }

    let mentions: any[] = [];
    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
    } else {
        mentions = loadOutWebmentions(site, postPath);
    }

    const tasks = [];
    for (const target of targets) {
        let mention = mentions.find((m: any) => m.target === target);
        if (mention) {
            if (mention?.updated && postUpdated.getTime() < new Date(mention.updated).getTime()) {
                continue;
            }
        } else {
            mention = { target };
            mentions.push(mention);
        }

        const resultPromise = sendWebmention({ source: siteConfig.url + postPath + "/", target }).then(result => {
            Object.assign(mention, result);
            mention.updated = new Date().toISOString();
            if (!result) {
                mention.status = 'error';
            }
            return mention;
        });
        tasks.push(resultPromise);
    }
    return Promise.all(tasks).then((results) => {
        if ((results?.length || 0) > 0) {
            console.log(`[webmention] sent ${results.length} webmentions from ${postPath}`, JSON.stringify(results, null, 2));
        }

        const filepath = getWebmentionPathOfTarget(site, postPath);
        if (!filepath) {
            console.error(`[webmention] can't find webmention target file path for ${postPath}`);
            return;
        }
        let data = YAML.stringify(mentions);
        fs.writeFileSync(filepath, data, 'utf8');

        return mentions;
    });
}