import { build } from "$lib/server/sitemap";
import { getSiteConfig } from "$lib/server/config";

export async function GET({ locals }) {
    const { site } = locals;
    
    const siteConfig = getSiteConfig(site, 'en');

    let { posts, taxonomies } = build(site);

    let responseText = posts.map((post: any) => `${siteConfig.url}${post.attributes.url}`).join('\n');

    responseText += '\n';

    responseText += taxonomies.map((taxonomy: string) => `${siteConfig.url}${taxonomy}`).join('\n');

    return new Response(responseText,
        {
            headers: {
                'Content-Type': 'text/plain'
            }
        }
    );
}