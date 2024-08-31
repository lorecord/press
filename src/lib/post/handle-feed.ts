import { getSiteConfig } from "$lib/server/config";
import type { Site } from "$lib/server/sites";
import { t } from "$lib/translations";
import { convertToPost } from "./handle-posts";
import type { Post, PostRaw } from "./types";

export type FeedRender = (posts: Post[], lang: string, siteConfig: any, defaultAuthor: any, supportedLocales: string[], websub: any) => string;

export const renderFeed = (requestAcceptHeader: string | null, url: URL, posts: Post[], lang: string, siteConfig: any, defaultAuthor: any, supportedLocales: string[], websub: any): { body: string, headers: { [key: string]: string } } => {

    let type = 'rss';

    let contentType = 'application/rss+xml;charset=UTF-8';

    if ((requestAcceptHeader && requestAcceptHeader.includes('application/atom+xml'))
        || url.href.endsWith('atom')) {
        type = 'atom';
        contentType = 'application/atom+xml;charset=UTF-8';
    } else if ((requestAcceptHeader && requestAcceptHeader.includes('application/feed+json'))
        || url.href.endsWith('json')) {
        type = 'json';
        contentType = 'application/feed+json;charset=UTF-8';
    } else if ((requestAcceptHeader && requestAcceptHeader.includes('application/json'))
        || url.href.endsWith('json')) {
        type = 'json';
        contentType = 'application/json;charset=UTF-8';
    }

    const renderMap: { [key: string]: FeedRender } = {
        'rss': renderRss,
        'atom': renderAtom,
        'json': renderJson
    }

    const headers: any = {
        'Content-Type': contentType,
        'Cache-Control': 'max-age=604800',
    };

    const body = renderMap[type](posts, lang, siteConfig, defaultAuthor, supportedLocales, websub);

    return { body, headers };
}


function escapeHtml(unsafe: string) {
    return unsafe
    // .replace(/&/g, "&amp;")
    // .replace(/</g, "&lt;")
    // .replace(/>/g, "&gt;")
    // .replace(/"/g, "&quot;")
    // .replace(/'/g, "&#039;");
}

/**
 * https://www.jsonfeed.org/version/1.1/
 */
const renderJson = (posts: Post[], lang: string, siteConfig: any, defaultAuthor: any, supportedLocales: string[], websubConfig?: { enabled: boolean, endpoint?: string | string[] }) => {

    const feed: any = {
        version: "https://jsonfeed.org/version/1.1",
        title: siteConfig.title,
        home_page_url: siteConfig.url,
        feed_url: `${siteConfig.url}/feed/`,
    };

    if (siteConfig.description) {
        feed.description = siteConfig.description;
    }

    if (defaultAuthor) {
        feed.authors = [{
            name: defaultAuthor.name,
            url: defaultAuthor.url,
            avatar: defaultAuthor.avatar
        }]
    }

    // next_url
    // icon
    // favicon
    // authors
    feed.language = lang;
    // expired
    if (websubConfig?.enabled) {
        feed.hubs = [websubConfig.endpoint || 'https://pubsubhubbub.superfeedr.com'].flat().filter(u => !!u);
    }

    feed.items = posts.map((post) => {
        const item: any = {
            id: `${siteConfig.url}${post.route}`,
            url: `${siteConfig.url}${post.route}`,
            // external_url: post.external_url,
            title: post.title || post.published?.date,
            date_published: post.published?.date,
            // content_text: post.content?.raw,
            content_html: post.content?.html,
            summary: post.summary?.raw,
            authors: post.author?.map((author: any) => ({
                name: author.name,
                url: author.url,
                avatar: author.avatar
            })),
            language: post.lang,
            tags: [...(post.taxonomy?.series || []), ...(post.taxonomy?.category || []), ...(post.taxonomy?.tag || [])],
        };
        if (post.image?.[0] || post.photo?.[0]) {
            item.image = `${siteConfig.url}${post.image?.[0] || post.photo?.[0]}`;
        }
        // banner_image = 
        if (post.modified?.date) {
            item.date_modified = post.modified?.date;
        }

        return item;
    });

    return JSON.stringify(feed);
}

/**
 * https://www.rssboard.org/rss-specification
 * 
 * 1. pubDate: https://www.w3.org/Protocols/rfc822/
 * 2. check: https://validator.w3.org/feed/
 * @param posts 
 * @param lang 
 * @returns 
 */
const renderRss = (posts: any, lang: string, siteConfig: any, defaultAuthor: any, supportedLocales: string[], websubConfig?: { enabled: boolean, endpoint?: string }) => (`<?xml version="1.0" encoding="UTF-8" ?>
<?xml-stylesheet href="/rss.xsl" type="text/xsl"?>
<rss version="2.0" 
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
    <atom:link href="${siteConfig.url}/feed/" rel="self" type="application/rss+xml" />
    ${supportedLocales.map((locale: any) => {
    return `<atom:link href="${siteConfig.url}/${locale}/feed/" rel="alternate" type="application/rss+xml" hreflang="${locale}" title="${t.get(`lang.${locale}`)}" />`
}).join('\n\t')}
    <title>${siteConfig.title || ''}</title>
    <description>${siteConfig.description}</description>
    <link>${siteConfig.url}</link>
    ${websubConfig?.enabled
        ? [websubConfig.endpoint || 'https://pubsubhubbub.superfeedr.com'].flat().filter(u => !!u).map(u => `<atom:link rel="hub" href="${u}" />`).join('\n') : ``}
    <language>${lang}</language>
    <generator>Press</generator>
    <copyright>Copyright (c)</copyright>
    <docs>https://www.rssboard.org/rss-specification</docs>
    ${posts?.[0]?.modified?.date || posts?.[0]?.published?.date ? `<lastBuildDate>${new Date(posts?.[0]?.modified?.date || posts?.[0]?.published?.date).toUTCString()}</lastBuildDate>` : ``}
    <ttl>60</ttl>
${posts.map((post: any) => `
    <item>
        <guid isPermaLink="true">${siteConfig.url}${post.route}</guid>
        <title>${post.title || post.published?.date}</title>
        <link>${siteConfig.url}${post.route}</link>
        <comments>${siteConfig.url}${post.route}#comments</comments>
        <description><![CDATA[${escapeHtml(post.summary?.raw)}]]></description>
        <content:encoded><![CDATA[${escapeHtml(post.content?.html)}]]></content:encoded>
        <pubDate>${new Date(post.published.date).toUTCString()}</pubDate>
        ${post.taxonomy?.category
                ? post.taxonomy.category
                    .map((category: any) => `<category>${category}</category>`).join('\n')
                : ''}
        ${post.taxonomy?.tag
                ? post.taxonomy.tag
                    .map((tag: any) => `<category>${tag}</category>`).join('\n\t\t') : ''}
    </item>`
        )
        .join('')}
</channel>
</rss>
`)

/**
 * https://datatracker.ietf.org/doc/html/rfc4287
 * @param posts 
 * @param lang 
 * @returns 
 */
const renderAtom = (posts: any, lang: string, siteConfig: any, defaultAuthor: any, supportedLocales: string[], websubConfig?: { enabled: boolean, endpoint?: string }) => (`<?xml version="1.0" encoding="UTF-8" ?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <id>${siteConfig.url}</id>
    <title type="text">${siteConfig.title || ''}</title>
    <subtitle type="text">${siteConfig.description}</subtitle>
    <link href="${siteConfig.url}" />
    ${websubConfig?.enabled
        ? [websubConfig.endpoint || 'https://pubsubhubbub.superfeedr.com'].flat().filter(u => !!u).map(u => `<link rel="hub" href="${u}" />`).join('\n') : ``}
    ${defaultAuthor ? `<author>
        <name>${defaultAuthor?.name}</name>
        <uri>${defaultAuthor?.url}</uri>
    </author>` : ``
    }
    ${posts?.[0]?.modified?.date || posts?.[0]?.published?.date ? `<updated>${new Date(posts?.[0]?.modified?.date || posts?.[0]?.published?.date).toISOString()}</updated>` : ``}
    <generator uri="https://press.lorecord.com" version="0.0.1">Press</generator>
    <link href="${siteConfig.url}" rel="alternate" type="text/html"/>
    <link href="${siteConfig.url}/feed/" rel="self" type="application/atom+xml"/>
    ${supportedLocales.map((locale: any) => {
        return `<link href="${siteConfig.url}/${locale}/feed/" rel="alternate" type="application/atom+xml" hreflang="${locale}" />`
    }).join('\n\t')}
    <rights>Copyright (c)</rights>
${posts.map((post: any) => `
    <entry>
        <id isPermaLink="true">${siteConfig.url}${post.route}</id>
        <title>${post.title || post.published?.date}</title>
        <link href="${siteConfig.url}${post.route}" />
        ${post.published.date
            ? `<published>${new Date(post.published.date).toISOString()}</published>`
            : ``}
        ${post.modified?.date
            ? `<updated>${new Date(post.modified?.date).toISOString()}</updated>`
            : ``}
        ${post.audio?.[0]
            ? `<link rel="enclosure" type="audio/mpeg"
        href="${post.audio?.[0].src}"/>`
            : ``}
        ${post.video?.[0]
            ? `<link rel="enclosure" type="video"
            href="${post.video?.[0].src}"/>`
            : ``}
        ${post.author
            ? post.author.map((author: any) => `<author>
            <name>${author.name}</name>
        </author>`).join('\n')
            : ``}
        ${post.contributor
            ? post.contributor.map((c: any) => `
        <contributor>
            <name>${c}</name>
        </contributor>
            `).join('\n')
            : ``}
        <summary><![CDATA[${escapeHtml(post.summary?.raw)}]]></summary>
        <content type="html"><![CDATA[${escapeHtml(post.content?.html)}]]></content>
        ${post.taxonomy?.category
            ? post.taxonomy.category
                .map((category: any) => `<category>${category}</category>`).join('\n')
            : ''}
        ${post.taxonomy?.tag
            ? post.taxonomy.tag
                .map((tag: any) => `<category>${tag}</category>`).join('\n\t\t') : ''}
    </entry>`
    )
        .join('')}
</feed>
`)

export function convertToPostForFeed(site: Site, raw: PostRaw) {
    let post: Post = convertToPost(site, raw, false);
    const siteConfig = getSiteConfig(site, post.lang);

    let feedHtml = `${post?.content?.html || ''}`;

    feedHtml = feedHtml.replace(/(<(?:a|img|video|audio).*?(?:href|src|source)=")([^"]*)("[^>]*?>)/g, (match, beforeHref, hrefValue, afterHref) => {
        const url: { value?: URL } = {};
        try {
            url.value = new URL(hrefValue, `${siteConfig.url}${post.route}`);
        } catch (e) {
            return match;
        }
        return `${beforeHref}${url.value.href}${afterHref}`;
    });

    if (post.langs) {
        feedHtml = `${feedHtml}
        <p>${post.langs?.map((lang: string) =>
            `<a rel="alternate" href="${siteConfig.url}/${lang}${post.route}">${t.get(`lang.${lang}`)}</a>`).join('\n')
            }</p>
        `;
    }

    function buildTree(data: any[]) {
        const result: any[] = [];
        const stack: any[] = [];

        data.forEach(item => {
            while (stack.length && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }

            const newNode = { ...item };
            if (stack.length) {
                const parent = stack[stack.length - 1];
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(newNode);
            } else {
                result.push(newNode);
            }

            stack.push(newNode);
        });

        return result;
    }

    function toHTML(tree: any[]) {
        return `<ul>${tree.map((node: any) => {
            let children: string = node.children ? toHTML(node.children) : '';
            return `<li><a href="${siteConfig.url}${raw.route}#${node.id}">${node.text}</a>${children}</li>`;
        }).join('')}</ul>`
    }

    if (post.toc?.enabled && post.content?.headings) {
        feedHtml = `
        <h3>${t.get("common.toc")}</h3>
        ${toHTML(buildTree(post.content?.headings as any[]))}
        ${feedHtml}`;
    }

    if (post.content) {
        post.content.html = feedHtml;
    } else {
        post.content = { html: feedHtml, headings: [], links: [], meta: {} };
    }


    return post;
}