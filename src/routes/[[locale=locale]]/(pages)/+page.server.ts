import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    const { localeContext, site } = locals;

    const systemConfig = getSystemConfig(site);
    const siteConfig = getSiteConfig(site, localeContext.uiLocale);

    return {
        localeContext,
        systemConfig,
        siteConfig
    };
}