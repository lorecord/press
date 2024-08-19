import fs from 'fs';

import remarkMathHelper from '$lib/markdown/rehype-math-helper';
import { rehypePrism } from '$lib/markdown/rehype-prism';
import remarkPrismHelper from '$lib/markdown/rehype-prism-helper';
import remarkLinks from '$lib/markdown/remark-links';
import remarkMermaid from '$lib/markdown/remark-mermaid';
import { loadRaw } from '$lib/resource';
import { getSiteAccount } from '$lib/server/accounts';
import { getSystemConfig } from '$lib/server/config';
import type { Site } from '$lib/server/sites';
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
import type { Post, PostRaw, PostRawAttributes, PostRoute } from './types';
import { enhanceObject } from '$lib/utils/enhance';

const DEFAULT_ATTRIBUTE_MAP: {
    [template: string]: PostRawAttributes
} = {
    default: {
        published: true,
        visible: true,
        routable: true,
        comment: {
            enable: false
        },
        discuss: {
            enable: false
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
            enable: true,
            reply: true
        },
        discuss: {
            enable: true
        },
    },
    links: {
        published: true,
        visible: true, // visible in menu, feed, sitemap and archive
        routable: true, // visitable by url
        comment: {
            enable: false,
            reply: true
        },
        discuss: {
            enable: false
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
            enable: true,
            reply: true,
        },
        discuss: {
            enable: true
        }
    }
}

const cache: {
    raw: {
        [key: `${string}-${string}`]: PostRaw
    },
    resource: any
} = {
    raw: {},
    resource: {}
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

    if (stat) {
        attributes.date = attributes.date || new Date(stat?.birthtime).toISOString();
        if (!attributes.modified?.date) {
            attributes.modified = Object.assign({}, attributes.modified || {}, { date: new Date(stat?.mtime).toISOString() });
        }
    }

    // TODO move to convert to post
    if (!attributes.summary) {
        let { summary, summary_html } = extractSummary(body);
        attributes.summary = summary;
        attributes.summary_html = summary_html;
    }

    const effectedTemplate = dataFromRaw.template || 'default';
    attributes = Object.assign({}, DEFAULT_ATTRIBUTE_MAP[effectedTemplate], attributes);

    let slashed = route?.endsWith('/') ? route : route + '/';
    let slug = localPath?.split('/').slice(-2)[0];

    attributes.slug = attributes.slug || slug;
    attributes.route = attributes.route || (
        slashed.endsWith(`/${slug}/`) ? slashed : slashed.replace(/\/[^\/]+\/$/, `/${slug}/`)
    );

    let postRaw: PostRaw = {
        resourceRaw,
        attributes,
        path: filepath,
        body,
        template: effectedTemplate,
        ...dataFromRaw,
    }, { };

    cache.raw[`${postRaw.lang}-${attributes.route}`] = postRaw;

    return postRaw;
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
        return { html: result, headings: processed.data.headings, links: processed.data.links, meta: processed.data.processMeta };
    }
    return { content: undefined, headings: [], links: [], processMeta: {} };
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
                code: [
                    ...(defaultSchema.attributes?.code || []),
                    ['className', /.*/]
                ],
                blockquote: [
                    ...(defaultSchema.attributes?.blockquote || []),
                    ['className', /.*/]
                ],
                div: [
                    ...(defaultSchema.attributes?.div || []),
                    ['className', /.*/]
                ],
                pre: [
                    ...(defaultSchema.attributes?.pre || []),
                    ['className', /.*/]
                ],
                span: [
                    ...(defaultSchema.attributes?.span || []),
                    ['className', /.*/],
                    ['line', /.*/]
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

export function getRaw(key: `${string}-${string}`) {
    let raw = cache.raw[key];
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

export function convertToPost(site: Site, raw: PostRaw): Post {
    handleAuthors(site, raw.attributes);

    let post: Post = enhanceObject({ ...raw.attributes }, {
        published: () => raw.attributes.published,
        uuid: raw.attributes.uuid || 'error none uuid',
        route: raw.attributes.route,
        lang: raw.lang,
        content: () => {
            const { html, headings, meta, links } = buildPostByMarkdown(raw?.body, raw?.lang, (tree: any) => {
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
                    enabled: true,
                }
            });
            return { html, headings, meta, links };
        }
    });

    return {
        ...raw?.attributes, content, headings, processMeta, links
    };
}

export function handleAuthors(site: Site, attr: { author?: string, authors?: string[], lang: string }) {

    if (!attr) {
        return;
    }

    const systemConfig = getSystemConfig(site);
    attr.isDefaultAuthor = !attr.author && !attr.authors;

    let mapper = (author: any) => {
        if (typeof author === 'string') {
            const account = getSiteAccount(site, author, attr.lang);
            if (account) {
                const { name, id, orcid, url } = account;
                return { name, id, orcid, url, account: author };
            } else {
                return { name: author, account: author };
            }
        }
        return author;
    };

    attr.authors = [attr.authors || attr.author || systemConfig.user?.default].flat()
        .filter((author) => !!author)
        .map(mapper);

    attr.contributors = [attr.contributors].flat()
        .filter((author) => !!author)
        .map(mapper);
}


