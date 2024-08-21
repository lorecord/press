import { loadTranslations, locale } from '$lib/translations';
import type { LayoutLoad } from './$types';

export const trailingSlash = 'never';

export const load: LayoutLoad = async ({ url, parent, data }) => {
    const { localeContext } = data;
    let {
        uiLocale
    } = localeContext;

    if (uiLocale && !locale.get()) {
        await loadTranslations(uiLocale, url.pathname);
    }
    return {};
}