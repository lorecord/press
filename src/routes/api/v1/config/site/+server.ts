import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
    const { site } = locals as any;
    let lang = url.searchParams.get('lang');
    const systemConfig = getSystemConfig(site);
    if (!lang || lang === 'undefined' || lang === 'null') {
        lang = systemConfig.locale?.default || 'en';
    }
    let siteConfig = getSiteConfig(site, lang || 'en');
    siteConfig = Object.assign({}, siteConfig);
    delete siteConfig.private;

    return json(siteConfig, { status: 200 });
}