import i18n, { type Config } from "sveltekit-i18n";
import YAML from 'yaml';
import fs from 'fs';
import lang from './lang.yml';

const config: Config = ({
    translations: {
        en: { lang },
        'zh-CN': { lang }
    },
    loaders: createLoaders(['en', 'zh-CN'], ['common', 'email'])
});

async function importExternalYAML(filepath: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject();
                return;
            }
            if (!data) {
                resolve({});
                return;
            }
            let parsed = YAML.parse(data);
            resolve(parsed);
        });
    })
}

function createLoaders(locales: string[], keys: string[]) {
    const loaders = [];
    for (let locale of locales) {
        for (let key of keys) {
            loaders.push({
                locale,
                key,
                loader: async () => (await import(`./${locale}/${key}.yml`) as any).default
            });
        }
    }
    return loaders;
}

export const { t, l, locale, locales, loading, translations, loadTranslations, setLocale } = new i18n(config);