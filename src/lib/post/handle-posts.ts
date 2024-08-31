import fs from 'fs';

import { dev } from '$app/environment';
import type { UserAuthor } from '$lib/interaction/types';
import remarkMathHelper from '$lib/markdown/rehype-math-helper';
import { rehypePrism } from '$lib/markdown/rehype-prism';
import remarkPrismHelper from '$lib/markdown/rehype-prism-helper';
import remarkAttrs from '$lib/markdown/remark-attrs';
import remarkLinks from '$lib/markdown/remark-links';
import remarkMermaid from '$lib/markdown/remark-mermaid';
import { loadRaw } from '$lib/resource';
import { getSiteAccount } from '$lib/server/accounts';
import { getSiteConfig, getSystemConfig } from '$lib/server/config';
import type { Site } from '$lib/server/sites';
import type { ContactBaseProfile } from '$lib/types';
import { addRelToExternalLinks } from '$lib/utils/html';
import { untag } from '$lib/utils/xml';
import fm from 'front-matter';
import { globSync } from "glob";
import rephypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from "remark-parse";
import remarkSlug from 'remark-slug';
import { get } from 'svelte/store';
import { unified } from 'unified';
import { fetchPath } from '../handle-path';
import rehypeCodeFilename from '../markdown/rehype-code-filename';
import remarkAlert from '../markdown/remark-alert';
import remarkHeadings from '../markdown/remark-headings';
import remarkRehypeCustom from '../markdown/remark-rehype-custom';
import remarkFng from '../remark-fng';
import { createFootnoteReference } from '../remark-rehyper-handlers';
import { l } from '../translations';
import type { Post, PostAttributesContact, PostRaw, PostRawAttributes, PostRoute } from './types';

const DEFAULT_ATTRIBUTE_MAP: {
    [template: string]: PostRawAttributes
} = {
    default: {
        published: true,
        visible: true,
        routable: true,
        comment: {
            enabled: false
        },
        discuss: {
            enabled: false
        },
        menu: {
            header: true,
            footer: false
        }
    },
    item: {
        published: true,
        visible: true, // visible in menu, feed, sitemap and archive
        routable: true, // visitable by url
        comment: {
            enabled: true,
            reply: true
        },
        discuss: {
            enabled: true
        },
    },
    links: {
        published: true,
        visible: true, // visible in menu, feed, sitemap and archive
        routable: true, // visitable by url
        comment: {
            enabled: false,
            reply: true
        },
        discuss: {
            enabled: false
        },
        menu: {
            header: false,
            footer: true
        }
    },
    note: {
        published: true,
        visible: false,
        routable: true,
        comment: {
            enabled: true,
            reply: true,
        },
        discuss: {
            enabled: true
        }
    }
}

const cache: {
    [site: string]: {
        raw: {
            [key: string]: PostRaw | undefined
        },
        resource: any
    }
} = {
};

/**
 * @typedef {Object} LangMappedRaw
 */
export interface LangMappedRaw {
    path: string
    languages: {
        [key: string]: PostRaw
    }
}

/**
 * 
 * @param body Markdown body
 */
export function extractSummary(body: string) {
    let summaryRaw: string;

    if (body.indexOf('\n\n===') != -1) {
        summaryRaw = body.split(/\n+===+/)[0].trim();
    } else {
        summaryRaw = body.split('\n')[0].trim();
    }
    // remove footnote reference
    summaryRaw = summaryRaw.replace(/\[\^[\w-_]+\]/g, '');

    let summaryHtml = markdown(summaryRaw);
    return {
        summary_html: summaryHtml,
        summary: untag(summaryHtml).trim()
    }
}

export function loadFrontMatterRaw(site: Site, filepath: string): PostRaw | undefined {
    if (!fs.existsSync(filepath)) {
        console.error(`loadFrontMatterRaw: File not found for '${filepath}'`);
        return;
    }

    const resourceRaw = loadRaw(site, filepath);
    if (!resourceRaw) {
        return;
    }
    const { stat, localPath, name, route, locales } = resourceRaw;

    let dataFromRaw: {
        template?: string,
        lang?: string,
        langs?: string[]
    } = {};

    if (name) {
        /** parse name with regexp as {template}.{lang}.md */
        let match = name.match(/^(.*?)\.(?:([^.]+)\.)?md$/);
        if (match) {
            let [, template, lang] = match;
            dataFromRaw.template = template;
            if (lang) {
                dataFromRaw.lang = lang;
                dataFromRaw.langs = locales?.map((l: any) => l.lang);
            }
        }
    }

    let file = fs.readFileSync(filepath, 'utf8');
    // read attributes by front-matter
    let { attributes, body }: {
        attributes: PostRawAttributes,
        body: string
    } = fm<any>(file);

    let rawAttributes = attributes;

    const effectedTemplate = dataFromRaw.template || 'default';
    attributes = Object.assign({}, DEFAULT_ATTRIBUTE_MAP[effectedTemplate], attributes);

    const { title, author, contributor, sponsor, taxonomy, keywords, summary, category, tag, series, license, uuid, date, visible, routable, menu, comment, discuss, syndication, type, webmention, pingback, route: routeInAttributes, slug, toc, published, modified, deleted, featured, image, audio, video, photo, ...data } = attributes;

    let defaultDate = (() => {
        let dateFieldValue = date as any;
        if (dateFieldValue instanceof Date) {
            return dateFieldValue.toISOString();
        } else if (typeof dateFieldValue === 'string') {
            return dateFieldValue;
        } else if (typeof dateFieldValue === 'number') {
            return new Date(dateFieldValue).toISOString();
        }
    })();

    function resolvePostDate(value: string | boolean | undefined | {
        date: string
    }, defaultValue: string | undefined, defaultProvider: () => { date: string } | undefined): { date: string } | undefined {
        if (value === false) {
            return undefined;
        } else if (typeof value === 'string') {
            return {
                date: value
            };
        } else if (typeof value === 'object') {
            return value as { date: string };
        } else if (typeof value === 'number') {
            return {
                date: new Date(value).toISOString()
            };
        }

        if (defaultValue) {
            return {
                date: defaultValue
            };
        } else {
            return defaultProvider();
        }
    }

    let slashed = route?.endsWith('/') ? route : route + '/';
    let slugInPath = localPath?.split('/').slice(-2)[0].replace(/^\d+\./, '');

    let summaryObject: {
        raw: string,
        html: string
    } = { raw: '', html: '' };

    if (!attributes.summary) {
        let { summary, summary_html } = extractSummary(body);
        summaryObject = { raw: summary, html: summary_html };
    } else {
        summaryObject = { raw: attributes.summary, html: markdown(attributes.summary) };
    }

    const systemConfig = getSystemConfig(site);

    let postRaw: PostRaw = {
        ...dataFromRaw,
        summary: summaryObject,
        resourceRaw,
        attributes: rawAttributes,
        path: filepath,
        body,
        visible,
        routable,
        title,
        comment,
        discuss,
        menu,
        webmention: Object.assign({}, systemConfig.webmention || {}, typeof webmention === 'boolean' ? {
            enabled: webmention
        } : webmention),
        pingback: Object.assign({}, systemConfig.pingback || {}, typeof pingback === 'boolean' ? {
            enabled: pingback
        } : pingback),
        template: effectedTemplate,
        slug: attributes.slug || slugInPath,
        taxonomy: {
            category: [category, taxonomy?.category].flat().filter((c: any) => !!c) as string[],
            tag: [tag, taxonomy?.tag].flat().filter((c: any) => !!c) as string[],
            series: [series, taxonomy?.series].flat().filter((c: any) => !!c) as string[],
        },
        route: routeInAttributes || (
            slashed.endsWith(`/${attributes.slug || slugInPath}/`) ? slashed : slashed.replace(/\/[^\/]+\/$/, `/${attributes.slug || slugInPath}/`).replace(/\/+$/, '/')
        ),
        toc: {
            enabled: attributes.toc === true || (attributes.toc && attributes.toc.enabled === true) || false
        },
        published: resolvePostDate(published, defaultDate, () => {
            const { stat } = resourceRaw;
            return {
                date: stat?.birthtime.toISOString()
            };
        }),
        modified: resolvePostDate(modified, undefined, () => {
            const { stat } = resourceRaw;
            if (stat?.mtime.toISOString()) {
                return {
                    date: stat?.mtime.toISOString()
                };
            } else {
                return { date: defaultDate }
            }
        }),

        deleted: deleted ? resolvePostDate(deleted, defaultDate, () => {
            const { stat } = resourceRaw;
            return {
                date: stat?.mtime.toISOString()
            };
        }) : undefined,
        data,
        license,
        author: resolveContact(site, author || systemConfig.user?.default, dataFromRaw.lang || systemConfig.locale?.default || 'en'),
        contributor: resolveContact(site, contributor, dataFromRaw.lang || systemConfig.locale?.default || 'en'),
        sponsor: resolveContact(site, sponsor, dataFromRaw.lang || systemConfig.locale?.default || 'en'),
        featured,
        image: [image].flat().filter((c: any) => !!c) as string[],
        audio: [audio].flat().filter((c: any) => !!c).map((c: any) => {
            if (typeof c === 'string') {
                return { src: c };
            } else {
                return c;
            }
        }),
        video: [video].flat().filter((c: any) => !!c).map((c: any) => {
            if (typeof c === 'string') {
                return { src: c };
            } else {
                return c;
            }
        }),
        photo: [photo].flat().filter((c: any) => !!c).map((c: any) => {
            if (typeof c === 'string') {
                return { src: c };
            } else {
                return c;
            }
        })
    };

    const siteCache = cache[site.unique] || (cache[site.unique] = {
        raw: {} as any,
        resource: {} as any
    });
    siteCache.raw[buildRawCacheKey(postRaw.lang, postRaw.route)] = postRaw;

    return postRaw;
}

function buildRawCacheKey(lang: string | undefined, route: string) {
    lang = lang ? '/' + lang : '';
    return `${lang}${route}`;
}

export function loadAllPostRaws(site: Site): PostRaw[] {
    const { POSTS_DIR: path } = site?.constants;
    let fileNames = globSync(`${path}/**/*.md`);
    if (!fileNames?.length) {
        console.log(`loadPostRaws: No file found for ${path}.`);
    } else {
        console.debug(`loadPostRaws: ${fileNames.length} files found for ${path}.`);
    }

    let raws: PostRaw[] = fileNames
        .map(fileName => loadFrontMatterRaw(site, fileName))
        .filter(raw => !!raw) as PostRaw[];

    function resolveDate(pr: PostRaw) {
        let dateFieldValue = pr.attributes.date as any;
        if (dateFieldValue instanceof Date) {
            return dateFieldValue.getTime();
        } else if (typeof dateFieldValue === 'string') {
            return new Date(dateFieldValue).getTime();
        } else if (typeof dateFieldValue === 'number') {
            return dateFieldValue;
        }
        return -1;
    }

    return raws.sort((a, b) => resolveDate(b) - resolveDate(a));
}

export async function loadAllPostsFiles() {
    const allPostFiles = import.meta.glob(`./site/**/*.md`);
    const iterablePostFiles = Object.entries(allPostFiles);
    const allPosts = await Promise.all(
        iterablePostFiles.map(async ([path, resolver]) => {
            const { metadata } = await resolver() as { metadata: any };
            return {
                metadata,
                filepath: path,
            }
        })
    );
    return allPosts.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
}

export function buildPostByMarkdown(content: string, lang?: string, rehypeFunction?: (tree: any) => void, options: any = {}) {
    const parser = createMarkdownParser({ rehypeFunction, lang, config: options });

    if (content) {
        let processed = parser.processSync(content);
        let result = fixMarkdownHtmlWrapper(processed.value.toString());
        return {
            html: result, headings: processed.data.headings as any[], links: processed.data.links as any[], meta: processed.data.processMeta as any
        };
    }
    return { html: '', headings: [], links: [], meta: {} };
}

export function createMarkdownParser(options: {
    alertTagName?: string,
    rehypeFunction?: (tree: any) => void,
    lang?: string,
    config?: any
} = {}) {
    const {
        alertTagName = 'div',
        rehypeFunction = (tree: any) => tree,
        lang = 'en',
        config = {}
    } = options;
    const {
        mermaid: mermaidConfig
    } = config;

    const parser = unified()
        .use(remarkParse)
        .use(remarkFrontmatter)
        .use(remarkGfm)
        .use(remarkAttrs)
        .use(remarkMath)
        .use(remarkLinks)
        .use(remarkFng)
        .use(remarkAlert, { tagName: alertTagName })
        .use(remarkSlug)
        .use(remarkHeadings)
        .use(remarkMermaid, mermaidConfig)
        .use(remarkPrismHelper)
        .use(remarkMathHelper)
        .use(remarkRehypeCustom, {
            allowDangerousHtml: true,
            clobberPrefix: '', // default is 'user-content-'
            handlers: {
                footnoteReference: createFootnoteReference({
                    noteLabelPrefixText: get(l)(lang, 'common.footnote_ref_note'),
                })
            },
            footnoteLabelSupplier: (group: string) =>
                get(l)(lang, `common.footnote_${group}`),
            footnoteLabelIdSupplier: (group: string) => `footnote-label-${group}`,
            footnoteRefPrefixSupplier: (group: string) =>
                get(l)(lang, `common.footnote_ref_${group}`),
        })
        .use(rehypeCodeFilename)
        .use(rehypeRaw)
        // // .use(rehypeFng)
        .use(rehypePrism, { ignoreMissing: true })
        .use(rehypeSanitize, {
            ...defaultSchema,
            attributes: {
                ...defaultSchema.attributes,
                a: [
                    ...(defaultSchema.attributes?.a || []),
                    ['className', /.*/],
                    ['rel', /.*/],
                    ['target', /.*/],
                    ['style', /.*/],
                    ['lang', /.*/]
                ],
                code: [
                    ...(defaultSchema.attributes?.code || []),
                    ['className', /.*/],
                    ['lang', /.*/]
                ],
                blockquote: [
                    ...(defaultSchema.attributes?.blockquote || []),
                    ['className', /.*/]
                ],
                div: [
                    ...(defaultSchema.attributes?.div || []),
                    ['className', /.*/],
                    ['style', /.*/],
                    ['lang', /.*/]
                ],
                pre: [
                    ...(defaultSchema.attributes?.pre || []),
                    ['className', /.*/]
                ],
                span: [
                    ...(defaultSchema.attributes?.span || []),
                    ['className', /.*/],
                    ['line', /.*/],
                 ['style', /.*/],
                    ['lang', /.*/]
                ],
                details: [
                    ...(defaultSchema.attributes?.details || []),
                    ['className', /.*/],
                    ['open', /.*/]
                ],
                p: [
                    ...(defaultSchema.attributes?.p || []),
                    ['className', /.*/],
                    ['style', /.*/]
                ]

            }
        })
        .use(rephypeKatex)
        .use(rehypeStringify)
        .use(() => rehypeFunction || ((tree: any) => tree));
    return parser;
}

export function markdown(content: string, rehypeFunction?: (tree: any) => void) {
    const parser = createMarkdownParser({ rehypeFunction });
    let processed = parser.processSync(content);
    let result = processed.value;
    result = fixMarkdownHtmlWrapper(result.toString());
    return result;
}

export function fixMarkdownHtmlWrapper(content: string) {
    content = content.replace(/<p>===<\/p>/, '<!-- readmore -->');
    content = content.replace(/<\/body><\/html>\s*$/, '');
    content = content.replace(/^<html><head><\/head><body>/, '');
    return content;
}

export function getPostRaw(site: Site, lang: string | undefined, route: string): PostRaw | undefined {
    const key = buildRawCacheKey(lang, route);
    const siteCache = cache[site.unique] || (cache[site.unique] = {
        raw: {} as any,
        resource: {} as any
    });
    let raw = siteCache.raw[key];
    if (!raw) {
        console.log('getRaw: miss cache key:', key);
        const effectedRoute = route.endsWith('/') ? route.slice(0, -1) : route;
        raw = loadPostRaw(site, { route: effectedRoute, lang });
        if (raw) {
            siteCache.raw[key] = raw;
        } else {
            console.log('getRaw: Nothing found for route & lang', effectedRoute, lang);
        }
    }
    if (dev && !raw) {
        console.error(`getRaw: No raw found for key '${key}'.`);
    }

    return raw;
}

export function loadPostRaw(site: Site, { route, lang }: PostRoute): PostRaw | undefined {
    const systemConfig = getSystemConfig(site);
    lang = lang || systemConfig.locale?.default;
    let { target } = fetchPath(site, { route, lang, match: (file) => file.endsWith('.md') });
    if (target) {
        const rawObject = loadFrontMatterRaw(site, target.file);
        return rawObject;
    }
}

export async function loadPost(site: Site, { route, lang }: { route: string, lang?: string }) {
    const rawObject = loadPostRaw(site, { route, lang });
    if (rawObject) {
        const post = convertToPost(site, rawObject);
        return post;
    }
}

export function convertToPost(site: Site, raw: PostRaw, mermaidEnabled: boolean = true): Post {
    const { resourceRaw, path, attributes, body, ...rest } = raw;
    let post: Post = { ...rest };
    const { html, headings, meta, links } = buildPostByMarkdown(body, post.lang, (tree: any) => {
        // update footnote
        let handleChildren = (children: any[]) => {
            children.forEach((node: any) => {
                if (node.properties?.id) {
                    node.properties.id = node.properties.id.replace(/^(user-content-)+/, '');
                }
                if (node.type === 'element'
                    && 'a' === node.tagName
                    && node.properties?.href) {
                    node.properties.href = node.properties.href.replace(/^#(user-content-)+/, '#');
                }
                if (node.children) {
                    handleChildren(node.children);
                }
            });
        };
        handleChildren(tree.children);
    }, {
        mermaid: {
            enabled: mermaidEnabled,
        }
    });

    const systemConfig = getSystemConfig(site);
    const siteConfig = getSiteConfig(site);

    post.content = {
        html: systemConfig.domains?.primary && siteConfig.url ? addRelToExternalLinks(html, siteConfig.url, [systemConfig.domains.primary]) : html,
        headings,
        meta,
        links,
    }

    return post;
}

export function resolveContact(site: Site, author: PostAttributesContact | PostAttributesContact[] | undefined | string, lang: string): ContactBaseProfile[] {
    let result: ContactBaseProfile[] = [author].flat()
        .filter((author) => !!author)
        .map(author => author as PostAttributesContact)
        .map((author: PostAttributesContact) => {
            if (typeof author === 'string') {
                author = { user: author };
            }
            let user = (author as UserAuthor).user;
            if (user) {
                const account = getSiteAccount(site, user, lang);
                if (account) {
                    const { credentials, orcid, account: accountName, ...data } = account;
                    let contact: ContactBaseProfile = data;
                    contact.name = contact.name || accountName;

                    // if author.name is set, it will override the name from account, etc
                    let effected =
                        Object.assign({}, contact, author);
                    return effected;
                }
            }
            author.name = author.name || (author as any).user;
            return author;
        });
    return result;
}


