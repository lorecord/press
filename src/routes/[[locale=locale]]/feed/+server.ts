import { convertToPostForFeed } from "$lib/post/handle-posts";
import { getSiteAccount } from "$lib/server/accouns.js";
import { getSystemConfig, getSiteConfig } from "$lib/server/config";
import { getPublicPostRaws } from "$lib/server/posts";
import { locales, locale } from "$lib/translations";

import { get } from "svelte/store";

export async function GET({ request, locals }) {
    const { site } = locals;
    const systemConfig = getSystemConfig(site);

    let lang = locale.get() || systemConfig.locale?.default || 'en';

    const siteConfig = getSiteConfig(site, lang);

    const accept = request.headers.get('accept');

    let type = 'rss';

    let contentType = 'application/rss+xml;charset=UTF-8';

    if ((accept && accept.includes('application/atom+xml'))
        || request.url.endsWith('atom')) {
        type = 'atom';
        contentType = 'application/atom+xml;charset=UTF-8';
    }

    let postRaws = getPublicPostRaws(site);
    let posts = postRaws.map((p: any) => convertToPostForFeed(site, p))
        .filter((p: any) => p.template == 'item')
        .filter((p: any) => p.visible)
        .filter((p: any) => p.lang === lang);

    posts = posts?.slice(0, 20);

    const defaultAuthor = systemConfig.user?.default ? getSiteAccount(site, systemConfig.user?.default, lang) : undefined;

    let body = type === 'atom'
        ? renderAtom(posts, lang, siteConfig, defaultAuthor)
        : renderRss(posts, lang, siteConfig, defaultAuthor);

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'max-age=604800'
        }
    });
}

/**
 * https://www.rssboard.org/rss-specification
 * @param posts 
 * @param lang 
 * @returns 
 */
const renderRss = (posts: any, lang: string, siteConfig: any, defaultAuthor: any) => (`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>${siteConfig.title}</title>
    <description>${siteConfig.description}</description>
    <link>${siteConfig.url}</link>
    <language>${lang}</language>
    <generator>Press</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
${posts.map((post: any) => `
    <item>
        <guid isPermaLink="true">${siteConfig.url}${post.url}</guid>
        <title>${post.title}</title>
        <link>${siteConfig.url}${post.url}</link>
        <description><![CDATA[${post.content}]]></description>
        <pubDate>${new Date(post.date).toISOString()}</pubDate>
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
const renderAtom = (posts: any, lang: string, siteConfig: any, defaultAuthor: any) => (`<?xml version="1.0" encoding="UTF-8" ?>
<feed version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <title type="text">${siteConfig.title}</title>
    <subtitle type="text">${siteConfig.description}</subtitle>
    <link href="${siteConfig.url}" />
    ${defaultAuthor ? `<author>
        <name>${defaultAuthor?.name}</name>
    </author>` : ``
    }<updated>${new Date(posts[0].date).toISOString()}</updated>
    <generator uri="https://press.lorecord.com" version="0.0.1">Press</generator>
    <link href="${siteConfig.url}" rel="alternate" type="text/html"/>
    <link href="${siteConfig.url}/feed" rel="self" type="application/atom+xml"/>
${get(locales).map((locale: any) => {
        return `<link href="${siteConfig.url}/${locale}/feed" rel="alternate" type="application/atom+xml" hreflang="${locale}" />`
    })}
    <rights>Copyright (c)</rights>
${posts.map((post: any) => `
    <entry>
        <id isPermaLink="true">${siteConfig.url}${post.url}</id>
        <title>${post.title}</title>
        <link href="${siteConfig.url}${post.url}" />
        ${post.date
            ? `<published>${new Date(post.date).toISOString()}</published>`
            : ``}
        ${post.modified?.date
            ? `<updated>${new Date(post.modified?.date).toISOString()}</updated>`
            : ``}
        ${post.audio
            ? `<link rel="enclosure" type="audio/mpeg" length="1337"
        href="${post.audio}"/>`
            : ``}
        ${post.authors && !post.isDefaultAuthor
            ? post.authors.map((author: any) => `<author>
            <name>${author.name || author.account || author}</name>
        </author>`)
            : ``}
        ${post.contributors
            ? post.contributors.map((c: any) => `
        <contributor>
            <name>${c}</name>
        </contributor>
            `)
            : ``}
        <summary><![CDATA[${post.summary}]]></summary>
        <content type="html"><![CDATA[${post.content}]]></content>
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