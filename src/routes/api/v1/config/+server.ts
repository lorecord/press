import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import { json } from "@sveltejs/kit";

import crypto from 'crypto';

export function GET({ url, locals, request }) {
    const { site } = locals as any;
    let lang = url.searchParams.get('lang');

    let systemConfig = getSystemConfig(site);

    systemConfig = Object.assign({}, systemConfig);

    delete systemConfig.private;

    if (!lang || lang === 'undefined' || lang === 'null') {
        lang = systemConfig.locale?.default || 'en';
    }

    let siteConfig = getSiteConfig(site, lang || 'en');
    siteConfig = Object.assign({}, siteConfig);

    delete siteConfig.private;

    const etag = crypto.createHash('md5').update(JSON.stringify({ systemConfig, siteConfig })).digest('hex');

    const ifNoneMatch = request.headers.get('if-none-match');
    if (etag === ifNoneMatch) {
        return new Response(null, {
            status: 304, headers: {
                'Cache-Control': 'public, max-age=0',
                'ETag': etag
            }
        });
    }

    return json({ systemConfig, siteConfig }, {
        status: 200, headers: {
            'Cache-Control': 'public, max-age=0',
            'ETag': etag
        }
    });
}