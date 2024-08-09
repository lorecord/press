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
    calcInteractionId
} from './utils';
import path from 'path';


let cacheById: {
    [id: string]: {
        slug: string;
        interaction: NativeInteraction
    }
} = {};


export interface Comment {
    slug: string;
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

export function getNativeInteractionsFilePath(site: any, { slug }: { slug: string }) {
    const folder = getInteractionsFoler(site, { slug });
    if (folder) {
        const filepath = path.join(folder, 'native.yml');
        return filepath;
    }
}

export function loadNativeInteraction(site: any, { slug, id }: { slug: string, id: string }) {
    return (loadNativeInteractions(site, { slug }) || []).find((i: any) => i.id === id);
}

export function loadNativeInteractions(site: any, { slug }: { slug: string }) {

    let filepath = getNativeInteractionsFilePath(site, { slug });

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
            slug,
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
export function saveNativeInteraction(site: any, { slug }: { slug: string }, interaction: NativeInteraction) {
    let filepath = getNativeInteractionsFilePath(site, { slug });

    if (!filepath) {
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
    lang, channel, author, user, email, url, text, ip, target, id, verified, date
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
    date?: string
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

    return Object.assign({
        type: raw.type,
        channel: channel || 'native',
        id: id || calcInteractionId(raw, false),
        author: Object.assign({
            name: author,
            verified: verified,
        },
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
    }, optional(target, 'target'), optional(ip, 'ip', (ip) => encrypt(site, ip)),) as NativeReply;
}

export function saveCommentAsNativeInteraction(site: any, { slug, channel, lang, author, user, email, url, text, ip, reply, type, id, verified }: { slug: string, lang: string, channel?: string, author: string, user: string, email: string, url: string, text: string, ip: string, reply: string, type?: string, id?: string, verified?: boolean }) {
    let comment: any = {
        channel, lang, type, author, user, email, url, text, ip, reply, date: new Date(), id, verified
    };

    return saveNativeInteraction(site, { slug }, commentToInteraction(site, comment));
}