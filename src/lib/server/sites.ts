import { SITES_DIR } from '$lib/constants';
import fs from 'fs';
import YAML from 'yaml';
import { fileWatch } from '$lib/server/file-watch';
import { detectResourceLocales } from '$lib/resource';

let sites: any[] = [];
let defaultSite: any;

export function loadConfig(path: string) {
    if (!fs.existsSync(path)) {
        console.error(`No config file found for ${path}.`);
        return {};
    }
    let parsed = loadData(path);
    return Object.assign({}, parsed.public, { private: parsed.private });
}

export function loadData(path: string) {
    if (!fs.existsSync(path)) {
        console.error(`No config file found for ${path}.`);
        return {};
    }
    let file = fs.readFileSync(path, 'utf8');
    return YAML.parse(file);
}

function matchSite(domain: string) {
    return sites.find(site => site.domains.primary === domain || site.domains.aliases?.indexOf(domain) != -1) || defaultSite;
}

function load() {
    if (!fs.existsSync(SITES_DIR)) {
        console.error(`SITES_DIR '${SITES_DIR}' not found.`);
    }

    sites = fs.readdirSync(SITES_DIR).map((site) => {
        if (site === '.DS_Store') {
            return;
        }
        const SITE_DIR = `${SITES_DIR}/${site}`;
        const POSTS_DIR = `${SITE_DIR}/posts`;
        const PUBLIC_DIR = `${SITE_DIR}/public`;
        const DATA_DIR = `${SITE_DIR}/data`;
        const CONFIG_DIR = `${DATA_DIR}/config`;
        const ACCOUNTS_DIR = `${DATA_DIR}/accounts`;

        const SYSTEM_CONFIG_FILE = `${CONFIG_DIR}/system.yml`;
        const ENV_CONFIG_FILE = `${CONFIG_DIR}/env.yml`;

        const system = loadConfig(SYSTEM_CONFIG_FILE);
        const env = loadConfig(ENV_CONFIG_FILE);

        return {
            unique: site,
            domains: {
                primary: system.domains?.primary || site,
                aliases: system.domains?.aliases || []
            },
            constants: {
                SITE_DIR, POSTS_DIR, PUBLIC_DIR, DATA_DIR, CONFIG_DIR, SYSTEM_CONFIG_FILE, ACCOUNTS_DIR, ENV_CONFIG_FILE
            },
            system,
            env
        }
    }).filter(site => !!site);

    if (!sites.length) {
        console.error(`No sites found in SITES_DIR '${SITES_DIR}'.`);
        return;
    }

    for (let site of sites) {
        if (site.unique === 'default') {
            defaultSite = site;
            const sitesResource = detectResourceLocales(`${site.constants.CONFIG_DIR}/site.yml`);
            console.log('sitesResource', sitesResource);
            break;
        }
    }

    defaultSite = defaultSite || sites[0];

    for (let site of sites) {
        if (site.unique !== 'default') {
            site.system = Object.assign({}, {
                locale: {
                    supports: [defaultSite.system.locale?.default || 'en']
                },
            }, site.system);
        }
    }
}

fileWatch(SITES_DIR, load, 'sites');

function sitesInit() {
    load();
}

sitesInit();

export { sites, matchSite, sitesInit };