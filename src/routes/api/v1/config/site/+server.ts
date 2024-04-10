import { getSiteConfig } from "$lib/server/config";
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
    const { site } = locals;

    const lang = url.searchParams.get('lang');
    let siteConfig = getSiteConfig(site, lang || 'en');
    delete siteConfig.private;

    let body = JSON.stringify(siteConfig);

    return new Response(body, { status: 200 });
}