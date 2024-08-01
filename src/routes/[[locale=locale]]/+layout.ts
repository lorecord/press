import { loadTranslations, locale } from '$lib/translations';
import { dev } from "$app/environment";
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, parent, data }) => {
    let {
        uiLocale,
        pathLang
    } = data?.localeContext;

    if (uiLocale && !locale.get()) {
        if (dev) {
            console.debug('loading with pathLang', pathLang);
        }
        await loadTranslations(uiLocale, url.pathname);
    }
    return {};
}