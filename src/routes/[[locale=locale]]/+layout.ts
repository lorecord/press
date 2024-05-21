import type { Load } from '@sveltejs/kit';
import { loadTranslations, locale } from '$lib/translations';
import { get } from 'svelte/store';
import { selectedLocale } from '$lib/stores';
import { dev } from "$app/environment";

export const load: Load = async ({ url, parent, data }) => {
    const { siteConfig, systemConfig } = await parent();
    let {
        cookieLang,
        pathLang,
        acceptLang,
        defaultLang,
        fallbackLang,
        currentLang
    } = data?.translationContext;

    let $cookieLang = get(selectedLocale) || cookieLang;

    if (pathLang && !locale.get()) {
        if (dev) {
            console.debug('loading with pathLang', pathLang);
        }
        await loadTranslations(pathLang, url.pathname);
    } else {
        // auto mode
        let finnalLang = $cookieLang || acceptLang || currentLang || defaultLang || fallbackLang;

        if (dev) {
            console.debug(`
        $cookieLang: ${$cookieLang} / ${cookieLang}
        acceptLang: ${acceptLang}
        currentLang: ${currentLang}
        defaultLang: ${defaultLang}
        fallbackLang: ${fallbackLang}
        -> finnalLang: ${finnalLang}
        `);

            console.debug('loading lang auto', finnalLang);
        }
        await loadTranslations(finnalLang, url.pathname);
    }

    return { siteConfig, systemConfig };
}