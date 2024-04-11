import { fileWatch } from '$lib/server/file-watch';
import fs from 'fs';
import { sites, loadData } from './sites';
import { detectResourceLocales } from '$lib/resource';
import { getPreferredLang } from '$lib/translations/utils';
import path from 'path';
import { getSystemConfig } from './config';

let accountsOfSite: any = {};

function load() {
    for (const site of sites) {
        const { ACCOUNTS_DIR } = site.constants;

        const loadForSite = () => {
            if (!fs.existsSync(ACCOUNTS_DIR)) {
                console.log(`ACCOUNTS_DIR ${ACCOUNTS_DIR} not exsits`);
                return;
            }

            const accountNames = Object.keys(fs.readdirSync(ACCOUNTS_DIR).map((file: string) => path.basename(file).split(/[\.]/)[0]).reduce((acc: any, file: string) => {
                acc[file] = acc[file] || (acc[file] = 0);
                acc[file] += 1;
                return acc;
            }, {}));

            console.log(`[server/account.ts] accountNames of site ${site.unique}`, accountNames);

            let accounts: any = {};

            for (const accountName of accountNames) {
                let sitesResource = detectResourceLocales(`${ACCOUNTS_DIR}/${accountName}.yml`);

                let accountLocales = sitesResource.locales?.map((resource: any) => {
                    return Object.assign({}, loadData(path.join(sitesResource.folder, resource.filename)), { lang: resource.lang });
                });
                let accountBase = loadData(path.join(sitesResource.folder, sitesResource.default));

                accounts[accountName] = {
                    base: accountBase,
                    locales: accountLocales
                }
            }

            accountsOfSite[site.unique] = accounts;
        };
        loadForSite();

        fileWatch(ACCOUNTS_DIR, loadForSite, `${site.unique}-load-accounts`);
    }
}

function getSiteAccounts(site: any, lang: string) {
    const system = getSystemConfig(site);

    const accounts = accountsOfSite[site.unique] || {};

    return accounts.map((account: any) => buildAccountData(site, account, lang, system.locale?.default || 'en'));
}

function getSiteAccount(site: any, accountName: string, lang: string) {
    const system = getSystemConfig(site);

    const accounts = accountsOfSite[site.unique] || {};
    const account = accounts[accountName];
    if (!account) {
        return {};
    }
    return buildAccountData(site, account, lang, system.locale?.default || 'en');
}

function buildAccountData(site: any, account: any, lang: string, langDefault: string) {
    const { base = {}, locales = [] } = account;

    const finalLang = getPreferredLang([lang], locales.map((l: any) => l.lang), langDefault);

    const localeData = locales.find((l: any) => l.lang === finalLang);

    return Object.assign({}, base, localeData);
}

function configInit() {
    load();
}

configInit();

export { getSystemConfig, getSiteAccounts, getSiteAccount, configInit };