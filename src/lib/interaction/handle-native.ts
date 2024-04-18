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
import type { Interaction } from './types';
import { commentToInteraction } from './utils';
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
    const postRaw = loadPostRaw(site, { route: slug, lang: 'en' });
    if (postRaw) {
        const filepath = path.dirname(postRaw.path) + '/.data/interactions/native.yml';
        if (fs.existsSync(filepath)) {
            return filepath;
        }
    }
    const { DISCUSS_DIR } = site.constants;
    const systemConfig = getSystemConfig(site);
    let filepath = `${DISCUSS_DIR}/${systemConfig.locale?.default}/${slug}.yaml`;
    if (!fs.existsSync(filepath)) {
        console.error(`No discuss file found for ${slug}.`);
        return;
    }
    return filepath;
}

export function loadNativeInteration(site: any, { slug, id }: { slug: string, id: string }) {

    const systemConfig = getSystemConfig(site);
    let filepath = getNativeInteractionsFolder(site, { slug });

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
        comment.text = commentMarkdown(comment.text, comment.id, systemConfig.domains?.primary);
    });

    let comment = parsed.comments?.find((comment: any) => comment.id === id);
    return commentToInteraction(comment);
}

export function loadNativeInteractions(site: any, { slug }: { slug: string }) {

    let filepath = getNativeInteractionsFolder(site, { slug });

    if (!filepath) {
        return;
    }

    const systemConfig = getSystemConfig(site);

    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    parsed.comments?.forEach((comment: any) => {
        if (comment.email) {
            comment.email_md5 = Crypto.createHash('md5').update(comment.email).digest('hex');
            delete comment.email;
        }
        if (!comment.id) {
            comment.id = calcCommentId(comment, true);
        } else {
            comment.id += '';
        }
        delete comment.secret;
        delete comment.ip;
        comment.text = commentMarkdown(comment.text, comment.id, systemConfig.domains?.primary);
    });
    parsed.comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.sdate).getTime());
    return parsed.comments.map((comment: any): Interaction => commentToInteraction(comment));
}

export function commentMarkdown(content: string, id: string, domain: string) {
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

export function saveNativeInteration(site: any, { slug, lang, author, user, email, url, text, ip, reply }: { slug: string, lang: string, author: string, user: string, email: string, url: string, text: string, ip: string, reply: string }) {
    let filepath = getNativeInteractionsFolder(site, { slug });

    if (!filepath) {
        return;
    }

    let folder = path.dirname(filepath);

    let interactions: any = { lang, comments: [] };
    if (!fs.existsSync(folder)) {
        // create
        fs.mkdirSync(folder, { recursive: true });
    } else {
        interactions = YAML.parse(fs.readFileSync(filepath, 'utf8'))
    }

    let comment: any = {
        author, user, email, url, text, ip, reply, date: new Date()
    };

    comment.id = calcCommentId(comment, true);

    interactions.comments.push(comment);

    fs.writeFileSync(filepath, YAML.stringify(interactions));

    return comment;
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