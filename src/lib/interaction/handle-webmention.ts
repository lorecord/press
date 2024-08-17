import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { loadPostRaw } from '$lib/post/handle-posts';
import type { WebmentionInteraction, WebmentionRaw, WebmentionReply } from './types';
import Crypto from 'crypto';
import { getSiteConfig } from '$lib/server/config';
import { getInteractionsFoler } from './utils';
import { sendWebmention } from '$lib/webmention';

export function getWebmentionPathOfSource(site: any, postPath: string) {
    const folder = getInteractionsFoler(site, { slug: postPath });
    if (folder) {
        return path.join(folder, 'webmention/source.yml');
    }
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
        webmention: payload,
        url: payload.source,
        type,
        content: payload.post?.name,
        title: payload.post?.name,
        author: {
            name: payload.post?.author?.name,
            url: payload.post?.author?.url,
            avatar: payload.post?.author?.photo,
            verified: true
        }
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

    mentions = mentions.filter(m => m.webmention.source !== mention.webmention?.source);
    mentions.push(mention);
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
    mentions = mentions.filter((m: any) => m.webmention?.source !== source);

    let data = YAML.stringify(mentions);
    fs.writeFileSync(filepath, data, 'utf8');
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

        const resultPromise = sendWebmention({ source: siteConfig.url + postPath, target }).then(result => {
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