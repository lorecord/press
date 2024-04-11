import { getSiteConfig } from "$lib/server/config";

export async function GET({ locals }) {
    const { site } = locals;

    const siteConfig = getSiteConfig(site, 'en');

    let responseText = JSON.stringify({});

    return new Response(responseText,
        {
            headers: {
                'Content-Type': 'application/jrd+json'
            }
        }
    );
}