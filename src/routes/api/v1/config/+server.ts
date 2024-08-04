import { getSiteConfig, getSystemConfig } from "$lib/server/config";

export function GET({ url, locals }) {
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

    let body = JSON.stringify({ systemConfig, siteConfig });

    return new Response(body, { status: 200 });
}