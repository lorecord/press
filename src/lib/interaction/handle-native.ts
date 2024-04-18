import fs from 'fs';
import YAML from 'yaml';
import Crypto from 'crypto';
import { unified } from 'unified';
import remarkParse from "remark-parse";
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import { rehypePrism } from '$lib/markdown/rehype-prism';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { getSystemConfig } from '../server/config';
import type { Interaction, NativeInteraction } from './types';
import { commentToInteraction, getInteractionsFoler } from './utils';
import { loadPostRaw } from '$lib/post/handle-posts';
import path from 'path';

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

export function getNativeInteractionsFolder(site: any, { slug }: { slug: string }) {
    const folder = getInteractionsFoler(site, { slug });
    if (folder) {
        const filepath = path.join(folder, 'native.yml');
        if (fs.existsSync(filepath)) {
            return filepath;
        }
    }
}

export function getCommentFolder(site: any, { slug }: { slug: string }) {
    const { DISCUSS_DIR } = site.constants;
    const systemConfig = getSystemConfig(site);
    let filepath = `${DISCUSS_DIR}/zh-CN/${slug}.yaml`;
    if (!fs.existsSync(filepath)) {
        console.error(`No discuss file found for ${slug}.`, filepath);
        return;
    }
    return filepath;
}

export function loadComment(site: any, { slug, id }: { slug: string, id: string }) {

    const systemConfig = getSystemConfig(site);
    let filepath = getCommentFolder(site, { slug });

    if (!filepath) {
        return;
    }
    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    parsed.comments?.forEach((comment: any) => {
        if (comment.email) {
            comment.email_md5 = Crypto.createHash('md5').update(comment.email).digest('hex');
        }
        if (!comment.id) {
            comment.id = calcCommentId(comment, true);
        } else {
            comment.id += '';
        }
    });

    let comment = parsed.comments?.find((comment: any) => comment.id === id);
    return parsed.replies?.find((comment: any) => comment.id === id) || commentToInteraction(comment);
}

export function loadComments(site: any, { slug }: { slug: string }) {

    let filepath = getCommentFolder(site, { slug });

    if (!filepath) {
        return;
    }

    const systemConfig = getSystemConfig(site);

    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    parsed.comments?.forEach((comment: any) => {
        if (comment.email) {
            comment.email_md5 = Crypto.createHash('md5').update(comment.email).digest('hex');
            comment.email;
        }
        if (!comment.id) {
            comment.id = calcCommentId(comment, true);
        } else {
            comment.id += '';
        }
        delete comment.secret;
        comment.ip;
    });
    parsed.comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return parsed.comments;
}

export function loadNativeInteration(site: any, { slug, id }: { slug: string, id: string }) {
    return (loadNativeInteractions(site, { slug }) || []).find((i: any) => i.id === id);
}

export function loadNativeInteractions(site: any, { slug }: { slug: string }) {

    let filepath = getNativeInteractionsFolder(site, { slug });

    if (!filepath) {
        return;
    }

    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    const systemConfig = getSystemConfig(site);

    parsed.forEach((interaction: any) => {
        if (interaction.content) {
            interaction.content = markdown(interaction.content, interaction.id, systemConfig.domains?.primary);
        }
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
                            if ('a' === node.tagName) {
                                if (node.children?.length) {
                                    let text = node.children[0].value;
                                    if (text.match(/^(http|ftp|([\w-]+\.)+[a-zA-Z]{2,})|[a-zA-Z]+:\/\//)) {
                                        // text looks like a link
                                        if (node.properties?.href
                                            && text !== node.properties?.href) {
                                            // but not eq to href
                                            node.children[0].value = `${text}(${node.properties.href})`;
                                        }
                                    }
                                }

                                if (node.properties?.href?.match(/^([a-zA-Z]+:)?\/\//) // is a aboslute link
                                    && !node.properties?.href?.match(new RegExp(`^([a-zA-Z]+:)?\\/\\/${domain}`)) // is not internal link
                                ) {
                                    node.properties.rel = 'external nofollow';
                                }
                            }
                            if (node.children) {
                                handleChildren(node.children);
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
export function saveNativeInterationNew(site: any, { slug }, interaction: NativeInteraction) {
    let filepath = (() => {
        const folder = getInteractionsFoler(site, { slug });
        if (folder) {
            const filepath = path.join(folder, 'native.yml');
            return filepath;
        }
    })();

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
        interaction.id = calcCommentId(interaction, true);
        console.log('new interaction', interaction);
    }
    if (!interaction.published) {
        interaction.published = new Date().toISOString();
    }

    // TODO Attributes

    interactions = interactions.filter((i: any) => i.id !== interaction.id);
    interactions.push(interaction);

    fs.writeFileSync(filepath, YAML.stringify(interactions.sort((a: NativeInteraction, b: NativeInteraction) => new Date(a.published).getTime() - new Date(b.published).getTime())));

    return interaction;
}
export function saveNativeInteration(site: any, { slug, lang, author, user, email, url, text, ip, reply, type }: { slug: string, lang: string, author: string, user: string, email: string, url: string, text: string, ip: string, reply: string, type: string }) {

    let filepath = (() => {
        const folder = getInteractionsFoler(site, { slug });
        if (folder) {
            const filepath = path.join(folder, 'native.yml');
            return filepath;
        }
    })();

    console.log('filepath', filepath);

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

    let comment: any = {
        type, author, user, email, url, text, ip, reply, date: new Date()
    };

    comment.id = calcCommentId(comment, true);

    interactions.push(commentToInteraction(comment));

    console.log('write file', filepath);
    fs.writeFileSync(filepath, YAML.stringify(interactions));

    return commentToInteraction(comment);
}

export function calcCommentId(comment: any, force: boolean = false) {
    if (comment.id && !force) {
        return comment.id + '';
    }
    if (!comment.secret) {
        comment.secret = Crypto.createHash('sha1').update(JSON.stringify(comment)).digest('hex');
    }
    return Crypto.createHash('sha1').update(`${comment.secret}`).digest('hex');
}