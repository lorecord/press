import { build } from "$lib/server/sitemap";
import { getSiteConfig } from "$lib/server/config";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
    const { site } = locals as any;

    const siteConfig = getSiteConfig(site, 'en');

    let { posts, taxonomies } = build(site);

    let responseText = posts.map((post: any) => `${siteConfig.url}${post.route}`).join('\n');

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