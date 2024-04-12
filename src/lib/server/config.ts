import { fileWatch } from '$lib/server/file-watch';
import { sites, loadConfig } from './sites';
import { detectResourceLocales } from '$lib/resource';
import { getPreferredLang } from '$lib/translations/utils';
import path from 'path';

let configOfSite: any = {};
let systemOfSite: any = {};

function load() {
    for (const site of sites) {
        const { CONFIG_DIR, SYSTEM_CONFIG_FILE } = site.constants;
        const loadForSite = () => {
            const system = loadConfig(SYSTEM_CONFIG_FILE);
            systemOfSite[site.unique] = system;
            site.system = system;

            let sitesResource = detectResourceLocales(`${CONFIG_DIR}/site.yml`);

            let siteConfigLocales = sitesResource.locales?.map((resource: any) => {
                return Object.assign({}, loadConfig(path.join(sitesResource.folder, resource.filename)), { lang: resource.lang });
            });
            let siteConfigBase = loadConfig(path.join(sitesResource.folder, sitesResource.default));

            configOfSite[site.unique] = {
                base: siteConfigBase,
                locales: siteConfigLocales
            };
        };
        loadForSite();

        fileWatch(CONFIG_DIR, loadForSite, `${site.unique}-load-config`);
    }

    console.log('[server/config.ts] config loaded');
}

function getSystemConfig(site: any) {
    return systemOfSite[site.unique] || site.system || {};
}

function getSiteConfig(site: any, lang: string) {
    const system = getSystemConfig(site);

    const config = configOfSite[site.unique] || {};
    const { base = {}, locales = [] } = config;

    const finalLang = getPreferredLang([lang], locales.map((l: any) => l.lang), system.locale?.default || 'en');

    const localeConfig = locales.find((l: any) => l.lang === finalLang);

    return Object.assign({}, base, localeConfig);
}

function configInit() {
    load();
}

configInit();

export { getSystemConfig, getSiteConfig, loadConfig, configInit };