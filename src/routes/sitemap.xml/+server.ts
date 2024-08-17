import { build, formatDate } from "$lib/server/sitemap";
import { getSiteConfig } from "$lib/server/config";

export async function GET({ locals }) {

    const { site } = locals;
    const siteConfig = getSiteConfig(site, 'en');

    let { posts, taxonomies } = build(site);

    /**
     * Google ig url.priority and changefreq 
     * https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#xml
     * 
     * 
     * https://developers.google.com/search/docs/specialty/international/localized-versions
     */
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>${posts.map((post: any) => `
    <url>
        <loc>${siteConfig.url}${post.attributes.route}</loc>${(post.attributes.modified?.date || post.attributes.date)
                ? `
        <lastmod>${formatDate(new Date(post.attributes.modified?.date || post.attributes.date))}</lastmod>` : ''}${(post.attributes.langs || []).map((lang: string) => `
        <xhtml:link
            rel="alternate"
            hreflang="${lang}"
            href="${siteConfig.url}/${lang}${post.attributes.route}"/>`).join('')}
    </url>`).join('')
        }${taxonomies.map((taxonomy: string) => `
    <url>
        <loc>${siteConfig.url}${taxonomy}</loc>
    </url>
        `).join('')}
</urlset>`,
        {
            headers: {
                'Content-Type': 'application/xml'
            }
        });
}