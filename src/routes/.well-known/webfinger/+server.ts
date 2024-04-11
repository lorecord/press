import { getSiteConfig, getSystemConfig } from "$lib/server/config";

export async function GET({ locals }) {
    const { site } = locals;

    const siteConfig = getSiteConfig(site, 'en');
    const systemConfig = getSystemConfig(site);

    let responseText = JSON.stringify({
        "subject": "acct:youruser@your.instance.url",
        "links": [
            {
                "rel": "self",
                "type": "application/activity+json",
                "href": "https://your.instance.url/users/youruser"
            }
        ]
    });

    return new Response(responseText,
        {
            headers: {
                'Content-Type': 'application/jrd+json'
            }
        }
    );
}