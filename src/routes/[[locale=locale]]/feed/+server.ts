import { convertToPostForFeed } from "$lib/post/handle-feed";
import { getSiteAccount } from "$lib/server/accounts.js";
import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import { getPublicPostRaws } from "$lib/server/posts";
import { locale } from "$lib/translations";

export const trailingSlash = 'always';

export async function GET({ request, locals, params }) {
    const { site } = locals as any;
    const systemConfig = getSystemConfig(site);

    const { locale: localParam } = params;

    let lang = localParam || locale.get() || systemConfig.locale?.default || 'en';

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

    let posts = postRaws.map((p) => convertToPostForFeed(site, p))
        .filter((p) => p.template == 'item')
        .filter((p) => p.visible)
        .filter((p) => p.lang === lang);

    posts = posts?.slice(0, 20);

    const defaultAuthor = systemConfig.user?.default ? getSiteAccount(site, systemConfig.user?.default, lang) : undefined;

    let supportedLocales = Array.from(
        new Set([
            systemConfig.locale?.default || "en",
            ...(systemConfig.locale?.supports || []),
        ]),
    );

    let body = type === 'atom'
        ? renderAtom(posts, lang, siteConfig, defaultAuthor, supportedLocales, systemConfig.websub)
        : renderRss(posts, lang, siteConfig, defaultAuthor, supportedLocales, systemConfig.websub);

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'max-age=604800'
        }
    });
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
 * https://www.rssboard.org/rss-specification
 * 
 * 1. pubDate: https://www.w3.org/Protocols/rfc822/
 * 2. check: https://validator.w3.org/feed/
 * @param posts 
 * @param lang 
 * @returns 
 */
const renderRss = (posts: any, lang: string, siteConfig: any, defaultAuthor: any, supportedLocales: string[], websubConfig?: { enabled: boolean, endpoint?: string }) => (`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" 
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
    <atom:link href="${siteConfig.url}/feed/" rel="self" type="application/rss+xml" />
    <title>${siteConfig.title}</title>
    <description>${siteConfig.description}</description>
    <link>${siteConfig.url}</link>
    ${websubConfig?.enabled ? `<atom:link rel="hub" href="${websubConfig.endpoint || 'https://pubsubhubbub.superfeedr.com'}" />` : ``}
    <language>${lang}</language>
    <generator>Press</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
${posts.map((post: any) => `
    <item>
        <guid isPermaLink="true">${siteConfig.url}${post.route}</guid>
        <title>${post.title}</title>
        <link>${siteConfig.url}${post.route}</link>
        <description><![CDATA[${escapeHtml(post.summary?.html)}]]></description>
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
    <title type="text">${siteConfig.title}</title>
    <subtitle type="text">${siteConfig.description}</subtitle>
    <link href="${siteConfig.url}" />
    ${websubConfig?.enabled ? `<link rel="hub" href="${websubConfig.endpoint || 'https://pubsubhubbub.superfeedr.com'}" />` : ``}
    ${defaultAuthor ? `<author>
        <name>${defaultAuthor?.name}</name>
    </author>` : ``
    }${posts?.[0]?.modified?.date || posts?.[0]?.published?.date ? `<updated>${new Date(posts?.[0]?.modified?.date || posts?.[0]?.published?.date).toISOString()}</updated>` : ``}
    <generator uri="https://press.lorecord.com" version="0.0.1">Press</generator>
    <link href="${siteConfig.url}" rel="alternate" type="text/html"/>
    <link href="${siteConfig.url}/feed/" rel="self" type="application/atom+xml"/>
${supportedLocales.map((locale: any) => {
        return `<link href="${siteConfig.url}/${locale}/feed/" rel="alternate" type="application/atom+xml" hreflang="${locale}" />`
    })}
    <rights>Copyright (c)</rights>
${posts.map((post: any) => `
    <entry>
        <id isPermaLink="true">${siteConfig.url}${post.route}</id>
        <title>${post.title}</title>
        <link href="${siteConfig.url}${post.route}" />
        ${post.published.date
            ? `<published>${new Date(post.published.date).toISOString()}</published>`
            : ``}
        ${post.modified?.date
            ? `<updated>${new Date(post.modified?.date).toISOString()}</updated>`
            : ``}
        ${post.audio?.[0]
            ? `<link rel="enclosure" type="audio/mpeg"
        href="${post.audio?.[0]}"/>`
            : ``}
            ${post.video?.[0]
            ? `<link rel="enclosure" type="video"
            href="${post.video?.[0]}"/>`
            : ``}
        ${post.author
            ? post.author.map((author: any) => `<author>
            <name>${author.name}</name>
        </author>`)
            : ``}
        ${post.contributor
            ? post.contributor.map((c: any) => `
        <contributor>
            <name>${c}</name>
        </contributor>
            `)
            : ``}
        <summary><![CDATA[${escapeHtml(post.summary?.html)}]]></summary>
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