import i18n, { type Config } from "sveltekit-i18n";
import lang from './lang.yml';
import { browser } from "$app/environment";

export const knownLocales = Object.keys(lang);

const availableLocales = ((glob) => {
    const locales = new Set<string>();

    Object.keys(glob).forEach((key) => {
        // ./en/common.yml -> en
        let locale = key.split('/')[1];
        locales.add(locale);
    });
    return [...locales];
})(import.meta.glob('./*/*.yml'));

console.log('availableLocales', availableLocales);

const config: Config = (() => {
    const keys = ['common', 'email'];

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

    return {
        fallbackLocale: 'en',
        translations: availableLocales
            .reduce((acc: any, key) => {
                acc[key] = lang;
                return acc;
            }, {}),
        loaders: createLoaders(availableLocales, keys)
    };
})();

export const { t, l, locale, locales, loading, translations, loadTranslations, addTranslations, getTranslationProps, setLocale } = new i18n(config);

Promise.all(locales.get()
    .map((locale) => addTranslations(getTranslationProps(locale))));

locale.subscribe((value) => {
    if (browser) {
        console.log("locale changed to", value);
    }
});