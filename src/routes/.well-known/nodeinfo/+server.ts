import { getSiteConfig, getSystemConfig } from "$lib/server/config";

export async function GET({ locals }) {
    const { site } = locals;

    const siteConfig = getSiteConfig(site, 'en');
    const systemConfig = getSystemConfig(site);

    let responseText = JSON.stringify({
        "version": "2.0",
        "software": {
            "name": "lorepress",
            "version": "0.0.1"
        },
        "protocols": ["activitypub"],
        "services": {
            "inbound": [],
            "outbound": []
        },
        "openRegistrations": false,
        "usage": {
            "users": {
                "total": 1,
                "activeHalfyear": 234,
                "activeMonth": 1
            },
            "localPosts": 5678,
            "localComments": 0
        }
    }
    );

    return new Response(responseText,
        {
            headers: {
                'Content-Type': 'application/jrd+json'
            }
        }
    );
}