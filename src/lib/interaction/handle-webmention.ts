import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { loadPostRaw } from '$lib/post/handle-posts';
import type { WebmentionReply } from './types';
import Crypto from 'crypto';

export function loadMentions(site: any, postPath: string) {
    const postRaw = loadPostRaw(site, { route: postPath, lang: 'en' });
    if (!postRaw) {
        return [];
    }
    const filepath = path.dirname(postRaw.path) + '/.data/webmention/source.yml';

    if (!fs.existsSync(filepath)) {
        console.error(`No webmention file found for ${filepath}.`);
        return [];
    }
    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    return parsed.map((mention: any) => {
        const webmentionReply: WebmentionReply = {
            id: Crypto.createHash('md5').update(JSON.stringify({
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

export function saveMention(site: any, postPath: string, mention: any) {
    const postRaw = loadPostRaw(site, { route: postPath, lang: 'en' });
    if (!postRaw) {
        return;
    }
    const filepath = path.dirname(postRaw.path) + '/.data/webmention/source.yml';

    let mentions = [];

    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
    } else {
        mentions = loadMentions(site, postPath);
    }

    mentions = mentions.filter((m: any) => m.source !== mention.source);
    mentions.push(mention);
    let data = YAML.stringify(mentions);
    fs.writeFileSync(filepath, data, 'utf8');
}

export function deleteMention(site: any, postPath: string, mention: any) {
    const postRaw = loadPostRaw(site, { route: postPath, lang: 'en' });
    if (!postRaw) {
        return;
    }
    const filepath = path.dirname(postRaw.path) + '/.data/webmention/source.yml';

    let mentions = loadMentions(site, postPath);
    mentions = mentions.filter((m: any) => m.source !== mention.source);

    let data = YAML.stringify(mentions);
    fs.writeFileSync(filepath, data, 'utf8');
}