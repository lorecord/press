import i18n from "sveltekit-i18n";
import lang from './lang.json';

/** @type {import('sveltekit-i18n').Config} */
const config = ({
    translations: {
        en: { lang },
        'zh-CN': { lang }
    },
    loaders: createLoaders(['en', 'zh-CN'], ['common', 'auth'])
});

function createLoaders(locales: string[], keys: string[]) {
    const loaders = [];
    for (let locale of locales) {
        for (let key of keys) {
            loaders.push({
                locale,
                key,
                loader: async () => (await import(`./${locale}/${key}.json`)).default
            });
        }
    }
    return loaders;
}

export const { t, l, locale, locales, loading, translations, loadTranslations, setLocale } = new i18n(config);