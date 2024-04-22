import fs from 'fs';

import { globSync } from "glob";
import fm from 'front-matter';
import { unified } from 'unified';
import remarkMath from 'remark-math';
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from 'remark-gfm';
import rehypeFng from '../rehype-fng';
import remarkFng from '../remark-fng';
import remarkHeadings from '../markdown/remark-headings';
import remarkSlug from 'remark-slug';
import remarkAlert from '../markdown/remark-alert';
import remarkRehypeCustom from '../markdown/remark-rehype-custom';
import { createFootnoteReference } from '../remark-rehyper-handlers';
import rephypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { rehypePrism } from '$lib/markdown/rehype-prism';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import rehypeCodeFilename from '../markdown/rehype-code-filename';
import { fetchPath, type LangMap, type PathMeta } from '../handle-path';
import { t, l } from '../translations';
import { get } from 'svelte/store';
import { standardizePath, detectResourceLocales } from '$lib/resource';
import remarkMermaid from '$lib/markdown/remark-mermaid';
import remarkPrismHelper from '$lib/markdown/rehype-prism-helper';
import remarkMathHelper from '$lib/markdown/rehype-math-helper';
import { getSiteConfig, getSystemConfig } from '$lib/server/config';
import { getSiteAccount } from '$lib/server/accouns';

const DEFAULT_ATTRIBUTE_MAP: any = {
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
    }
}

const cache: {
    raw: any,
    resource: any
} = {
    raw: {},
    resource: {}
};

/**
 * @typedef {Object} Raw
 * 
 * Raw object of a markdown file.
 */
export interface Raw {
    path: string,
    attributes: any,
    body: string,
}

/**
 * @typedef {Object} LangMappedRaw
 */
export interface LangMappedRaw {
    path: string
    languages: {
        [key: string]: Raw
    }
}

/**
 * 
 * @param body Markdown body
 */
export function extractSummary(body: string) {
    if (body.indexOf('\n===+\n')) {
        let summary = body.split(/===+/)[0];

        // remove footnote reference
        summary = summary.replace(/\[\^[\w-_]+\]/g, '');

        let summary_html = markdown(summary);
        return {
            summary_html,
            summary: untag(summary_html)
        }
    }
    return {};
}

export function detectResourceRaw(resourcePath: string): { path: string, locales: { lang: string, filename: string }[] } {
    const { locales } = detectResourceLocales(resourcePath);
    return { path: resourcePath, locales };
}

export function loadRaw(site: any, filepath: string): { stat: fs.Stats, localPath: string, name: string, url: string, locales: { lang: string, filename: string }[], standardizedPath: string } | any {
    const { POSTS_DIR } = site.constants;

    if (!fs.existsSync(filepath)) {
        console.error(`loadRaw: File not found for '${filepath}'`);
        return {};
    }

    let standardizedPath = standardizePath(filepath); // `\\`->`/`

    let stat = fs.statSync(filepath);

    debugger;

    let localPath = standardizedPath.replace(`${POSTS_DIR.replace(/\\/g, '/')}`, '')

    let tempPath = localPath.replaceAll(/\(.*?\)\//g, '');

    let name = tempPath.split('/').pop();
    let url = tempPath.split('/').slice(0, -1).join('/')
        .replace(/\/\d+\./, '/');

    let { locales } = detectResourceRaw(filepath);

    return { stat, localPath, name, url, locales, standardizedPath };
}

export function loadFrontMatterRaw(site: any, filepath: string): Raw | undefined {
    if (!fs.existsSync(filepath)) {
        console.error(`loadFrontMatterRaw: File not found for '${filepath}'`);
        return;
    }

    let { stat, localPath, name, url, locales } = loadRaw(site, filepath);

    let file = fs.readFileSync(filepath, 'utf8');
    // read attributes by front-matter
    let { attributes, body } = fm<any>(file);

    let url_trailing_slash = url?.endsWith('/') ? url : url + '/';
    let slug = localPath?.split('/').slice(-2)[0];

    if (name) {
        /** parse name with regexp as {template}.{lang}.md */
        let match = name.match(/^(.*?)\.(?:([^.]+)\.)?md$/);
        if (match) {
            let [, template, lang] = match;
            attributes.template = template;
            if (lang) {
                attributes.lang = lang;
                attributes.langs = locales?.map((l: any) => l.lang);
            }
        }
    }

    attributes.url = url_trailing_slash;
    attributes.slug = slug;

    if (stat) {
        if (!attributes.date) {
            attributes.date = new Date(stat?.birthtime).toISOString();
        }
        if (!attributes.modified?.date) {
            attributes.modified = Object.assign({}, attributes.modified || {}, { date: new Date(stat?.mtime).toISOString() });
        }
    }

    if (!attributes.summary) {
        let { summary, summary_html } = extractSummary(body);
        attributes.summary = summary;
        attributes.summary_html = summary_html;
    }

    const template = attributes.template || 'default';
    attributes = Object.assign({}, DEFAULT_ATTRIBUTE_MAP[template], attributes);

    cache.raw[`${attributes.lang}-${slug}`] = { path: filepath, attributes, body };

    return { path: filepath, attributes, body };
}

export function untag(html: string) {
    return html.replaceAll(/<.*?>/g, '');
}

export function loadAllPostRaws(site: any) {
    const { POSTS_DIR } = site?.constants;
    return loadPostRaws(site, POSTS_DIR);
}

export function loadAllPublicPostRaws(site: any) {
    const result = loadAllPostRaws(site)
        .filter(r => r.attributes?.published)
        .filter(r => r.attributes?.visible)
        .filter(r => r.attributes?.routable)
        .filter(r => new Date(r.attributes?.date).getTime() < Date.now())
        .filter(r => {
            let attr = r.attributes;
            delete attr.published;
            delete attr.routable;
            return true;
        });

    return result;
}

export function loadPostRaws(site: any, path: string) {
    let fileNames = globSync(`${path}/**/*.md`);
    if (!fileNames?.length) {
        console.log(`loadPostRaws: No file found for ${path}.`);
    }
    console.debug(`loadPostRaws: ${fileNames.length} files found for ${path}.`);

    return fileNames
        .map(fileName => loadFrontMatterRaw(site, fileName))
        .filter(raw => raw !== undefined)
        .sort((a, b) => new Date(b.attributes.date).getTime() - new Date(a.attributes.date).getTime());
}

export async function loadAllPosts() {
    const allPostFiles = import.meta.glob(`./site/**/*.md`);
    const iterablePostFiles = Object.entries(allPostFiles);
    // return posts
    //     .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());
    const allPosts = await Promise.all(
        iterablePostFiles.map(async ([path, resolver]) => {
            const { metadata } = await resolver()
            return {
                metadata,
                filepath: path,
            }
        })
    );
    allPosts.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
    return allPosts;
}

export function buildPostByMarkdown(content: string, lang: string, rehypeFunction?: (tree: any) => void, options: any = {}) {
    const parser = createMarkdownParser({ rehypeFunction, lang, config: options });

    if (content) {
        let processed = parser.processSync(content);
        let result = fixMarkdownHtmlWrapper(processed.value.toString());
        return { content: result, headings: processed.data.headings, processMeta: processed.data.processMeta };
    }
    return { content: undefined, headings: [], processMeta: {} };
}

export function createMarkdownParser(options: any = {}) {
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
            footnoteLabelSupplier: (group) =>
                get(l)(lang, `common.footnote_${group}`),
            footnoteLabelIdSupplier: (group) => `footnote-label-${group}`,
            footnoteRefPrefixSupplier: (group) =>
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
                blockqoute: [
                    ...(defaultSchema.attributes?.blockqoute || []),
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
        .use(() => options.rehypeFunction || ((tree: any) => tree));
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

export function fetchRaw(key: string) {
    let raw = cache.raw[key];
    return raw;
}

export function fetchPostPath(site: any, { route, lang }: { route: string, lang?: string }): { target: PathMeta | undefined, langMap: LangMap | undefined } {
    return fetchPath(site, { route, lang, match: (file) => file.endsWith('.md') });
}

export function loadPostRaw(site: any, { route, lang }: { route: string, lang?: string }): any {
    const systemConfig = getSystemConfig(site);
    lang = lang || systemConfig.locale?.default;
    let { target, langMap } = fetchPostPath(site, { route, lang });
    if (target) {
        const rawObject = loadFrontMatterRaw(site, target.file);
        return rawObject;
    }
    return {};
}

export async function loadPost(site: any, { route, lang }: { route: string, lang?: string }) {
    const rawObject = loadPostRaw(site, { route, lang });
    if (rawObject) {
        const post = convertToPost(site, rawObject);
        return post;
    }
    return {};
}

export function convertToPost(site: any, raw: Raw) {
    const { content, headings, processMeta } = buildPostByMarkdown(raw?.body, raw?.attributes?.lang, (tree: any) => {
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

    handleAuthors(site, raw.attributes);
    return {
        ...raw?.attributes, content, headings, processMeta
    };
}

function handleAuthors(site: any, attr: { author?: string, authors?: string[], lang: string } & any) {

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

export function convertToPostForFeed(site: any, raw: Raw) {
    const { content, headings } = buildPostByMarkdown(raw?.body, raw.attributes.lang, (tree: any) => {
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
            enabled: false
        }
    });

    const systemConfig = getSystemConfig(site);
    const siteConfig = getSiteConfig(site, raw.attributes.lang || systemConfig.locale?.default);

    let feedContent = `${content}`;

    if (raw.attributes.langs) {
        feedContent = `${feedContent}
        <p>${raw.attributes.langs.map((lang: string) =>
            `<a href="${siteConfig.url}/${lang}${raw.attributes.url}">${t.get(`lang.${lang}`)}</a>`)
            }</p>
        `;
    }

    if (raw.attributes.toc && headings) {
        feedContent = `
        <h3>${t.get("common.toc")}</h3>
        <ul>
        ${headings.map((heading: any) => `
        <li style="margin-left: ${heading.level * 10 - 20}px">
            <a href="${siteConfig.url}${raw.attributes.url}#${heading.id} "}>${heading.text}</a>
        </li>
        `).join('')}
        </ul>
        ${feedContent}`;
    }

    handleAuthors(site, raw.attributes);

    return {
        ...raw?.attributes, content: feedContent, headings
    };
}

export function convertToPreview(raw: Raw) {
    return { ...raw?.attributes };
}

export function findRelatedPosts() {
    return [];
}