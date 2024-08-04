import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
    const { site } = locals as any;
    let lang = url.searchParams.get('lang');
    const systemConfig = getSystemConfig(site);
    if (!lang || lang === 'undefined' || lang === 'null') {
        lang = systemConfig.locale?.default || 'en';
    }
    let siteConfig = getSiteConfig(site, lang || 'en');
    delete siteConfig.private;

    let body = JSON.stringify(siteConfig);

    return new Response(body, { status: 200 });
}