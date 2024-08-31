import fs from 'fs';
import YAML from 'yaml';
import { unified } from 'unified';
import remarkParse from "remark-parse";
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import { rehypePrism } from '$lib/markdown/rehype-prism';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { getSystemConfig } from '../server/config';
import type { NativeInteraction, NativeReply } from './types';
import {
    commentToInteraction,
    encrypt,
    getInteractionsFoler,
    hashEmailSha256,
    calcInteractionId,
    scoreSpam
} from './utils';
import path from 'path';
import { dev } from '$app/environment';


let cacheById: {
    [id: string]: {
        route: string;
        interaction: NativeInteraction
    }
} = {};


export interface Comment {
    route: string;
    lang: string;
    author: string;
    user: string;
    email: string;
    url: string;
    text: string;
    ip: string;
    reply: number;
    type: string;
}

export function getNativeInteraction(site: any, id: string) {
    let cached = cacheById[id];

    if (!cached) {
        console.warn('[interactoin-native] cache miss', id);
    }

    return cached;
}

export function getNativeInteractionsFilePath(site: any, { route }: { route: string }) {
    const folder = getInteractionsFoler(site, { route });
    if (folder) {
        const filepath = path.join(folder, 'native.yml');
        return filepath;
    }
}

export function loadNativeInteraction(site: any, { route, id }: { route: string, id: string }) {
    return (loadNativeInteractions(site, { route: route }) || []).find((i: any) => i.id === id);
}

export function loadPublishedNativeInteractions(site: any, { route }: { route: string }): NativeInteraction[] {
    return loadNativeInteractions(site, { route: route })
        .filter((interaction: NativeInteraction) =>
            !interaction.spam?.marked
            && !(interaction.status && interaction.status !== 'approved'));
}

export function loadNativeInteractions(site: any, { route }: { route: string }): NativeInteraction[] {

    let filepath = getNativeInteractionsFilePath(site, { route: route });

    if (!filepath || !fs.existsSync(filepath)) {
        return [];
    }

    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    const systemConfig = getSystemConfig(site);

    parsed.forEach((interaction: any) => {
        if (interaction.content) {
            interaction.contentHTML = markdown(interaction.content, interaction.id, systemConfig.domains?.primary);
        }
        cacheById[interaction.id] = {
            route: route,
            interaction
        };
    });

    return parsed.sort((a: NativeInteraction, b: NativeInteraction) => new Date(b.published).getTime() - new Date(a.published).getTime());
}

export function markdown(content: string, id: string, domain: string) {
    const parser = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypePrism, { ignoreMissing: true })
        .use(rehypeRaw)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .use(() => (tree: any) => {
            {
                let handleChildren = (children: any[]) => {
                    children.forEach((node: any) => {
                        if (node.type === 'element') {
                            if (node.children) {
                                handleChildren(node.children);
                            }
                            if ('a' === node.tagName) {
                                let theLink = node;
                                if (node.children?.length) {
                                    let text = node.children[0].value;
                                    if (text.match(/^(((http|ftp)s?:\/\/)|([\w-]+\.)+[a-zA-Z]{2,})|[a-zA-Z]+:\/\//)) {
                                        // text looks like a link
                                        if (node.properties?.href
                                            && text !== node.properties?.href
                                            && node.properties?.href.replace(/^(http|ftp)s?:\/\//, '') !== text) {
                                            // but not eq to href
                                            node.children[0].value = `${text}`;

                                            node.tagName = "span";
                                            theLink = {
                                                type: 'element',
                                                tagName: 'a',
                                                properties: { href: node.properties.href },
                                                children: [{ type: 'text', value: node.properties?.href }]
                                            };
                                            delete node.properties?.href;
                                            node.children.push({
                                                type: 'element',
                                                tagName: 'sub',
                                                children: [{ type: 'text', value: "(" }, theLink, { type: 'text', value: ")" }]
                                            })
                                        }
                                    }
                                }

                                if (theLink.properties?.href?.match(/^([a-zA-Z]+:)?\/\//) // is a aboslute link
                                    && !theLink.properties?.href?.match(new RegExp(`^([a-zA-Z]+:)?\\/\\/${domain}`)) // is not internal link
                                ) {
                                    theLink.properties.rel = 'external nofollow';
                                    // theLink.properties.rel = 'external nofollow noopener';
                                    // theLink.properties.target = '_blank';
                                }
                            }

                        }
                    });
                }
                tree.children.forEach((node: any) => {
                    if (node.type === 'element') {
                        if (/^h[1-6]$/.test(node.tagName)) {
                            node.tagName = 'strong';
                        }
                        if (node.children) {
                            handleChildren(node.children);
                        }
                    }
                });
            }
            {
                tree.children.forEach((node: any) => {
                    if (node.properties?.id?.endsWith('-footnote-label')) {
                        node.children = [];
                        node.tagName = 'hr';
                    }
                })

                let handleChildren = (children: any[]) => {
                    children.forEach((node: any) => {
                        if (node.properties?.id) {
                            node.properties.id = node.properties.id.replace(/^(user-content-)+/, `comment-${id.substr(-8)}-`);
                        }
                        if (node.type === 'element'
                            && 'a' === node.tagName
                            && node.properties?.href) {
                            node.properties.href = node.properties.href.replace(/^#(user-content-)+/, `#comment-${id.substr(-8)}-`);

                        }
                        if (node.children) {
                            handleChildren(node.children);
                        }
                    });
                };
                handleChildren(tree.children);
            }
        });

    let processed = parser.processSync(content);
    let result = processed.value;
    // result = result.replace(/<\/body><\/html>\s*$/, '');
    // result = result.replace(/^<html><head><\/head><body>/, '');
    return result;
}

//
export function saveNativeInteraction<T extends NativeInteraction>(site: any, { route }: { route: string }, interaction: T): T | undefined {
    if (dev) {
        console.log('[saving NativeInteraction]', route, interaction);
    }
    let filepath = getNativeInteractionsFilePath(site, { route });

    if (!filepath) {
        console.error('NativeInteraction path not found', route);
        return;
    }

    let folder = path.dirname(filepath);

    let interactions: any = [];
    if (!fs.existsSync(folder)) {
        // create
        fs.mkdirSync(folder, { recursive: true });
    } else if (fs.existsSync(filepath)) {
        interactions = YAML.parse(fs.readFileSync(filepath, 'utf8'))
    }

    if (!interaction.id) {
        interaction.id = calcInteractionId(interaction, true);
        console.warn('interaction gen id', interaction.id);
    }
    if (!interaction.published) {
        interaction.published = new Date().toISOString();
    }

    interactions = interactions.filter((i: any) => i.id !== interaction.id);
    interactions.push(interaction);

    fs.writeFileSync(filepath, YAML.stringify(interactions.sort((a: NativeInteraction, b: NativeInteraction) => new Date(a.published).getTime() - new Date(b.published).getTime())));

    return interaction;
}

export function createNativeInteractionReply(site: any, {
    lang, channel, author, user, email, url, text, ip, target, id, verified, date, authorLang
}: {
    lang: string,
    channel?: string,
    author: string,
    user?: string,
    email: string,
    url: string,
    text: string,
    ip?: string,
    target?: string,
    id?: string,
    verified?: boolean,
    date?: string,
    authorLang: string,
}) {
    function optional(value: any, key: string, callback?: (value: any) => any) {
        return value && value !== '' ? {
            [key]: callback ? callback(value) : value
        } : {};
    }

    let raw = {
        type: 'reply',
        lang, author,
        email, url, text, ip, target, channel
    };

    let result = Object.assign({
        type: raw.type,
        channel: channel || 'native',
        id: id || calcInteractionId(raw, false),
        author: Object.assign({},
            optional(verified, 'verified'),
            optional(author, 'name'),
            optional(authorLang, 'lang'),
            optional(user, 'user'),
            optional(url, 'url'),
            optional(email, 'email', () => ({
                value: encrypt(site, email),
                hash: {
                    sha256: hashEmailSha256(email),
                }
            })),
        ),
        published: date || new Date().toISOString(),
        content: text,
        lang
    },
        optional(target, 'target'),
        optional(ip, 'ip', (ip) => encrypt(site, ip))) as NativeReply;

    const score = scoreSpam(result);
    if (score > 0) {
        result.spam = { score };
        if (score >= 6) {
            result.spam.marked = true;
            result.status = 'rejected';
        } else if (score >= 4) {
            result.spam.marked = true;
            result.status = 'auditing';
        } else if (score >= 2) {
            result.status = 'auditing';
        }
    }

    return result;
}

export function saveCommentAsNativeInteraction(site: any, { route, channel, lang, author, user, email, url, text, ip, reply, type, id, verified }: { route: string, lang: string, channel?: string, author: string, user: string, email: string, url: string, text: string, ip: string, reply: string, type?: string, id?: string, verified?: boolean }) {
    let comment: any = {
        channel, lang, type, author, user, email, url, text, ip, reply, date: new Date(), id, verified
    };

    return saveNativeInteraction(site, { route }, commentToInteraction(site, comment));
}