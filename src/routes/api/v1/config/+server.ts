import { getSiteConfig, getSystemConfig } from "$lib/server/config";

export function GET({ url, locals }) {
    const { site } = locals;

    const lang = url.searchParams.get('lang');
    let systemConfig = getSystemConfig(site);
    let siteConfig = getSiteConfig(site, lang || 'en');

    delete systemConfig.private;
    delete siteConfig.private;

    let body = JSON.stringify({ systemConfig, siteConfig });

    return new Response(body, { status: 200 });
}