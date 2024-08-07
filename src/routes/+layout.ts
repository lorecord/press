import { locale, setLocale, addTranslations } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { dev } from '$app/environment';

export const load: LayoutLoad = async ({ url, fetch, depends, data }) => {
    const { pathname } = url;
    const { localeContext, translations } = data;

    addTranslations(translations);

    if (dev) {
        console.log('[routes/+layout.ts] => localeContext', localeContext);
    }

    if (dev) {
        console.log('[routes/+laytou.ts] $locale', locale.get());
    }

    if (localeContext.uiLocale && !locale.get()) {
        if (dev) {
            console.log('[/+laytou.ts] trying to set locale', localeContext.uiLocale);
        }
        await setLocale(localeContext.uiLocale);
    }

    depends('locale:locale');

    let lang = locale.get() || localeContext.uiLocale;

    if (dev) {
        console.log('[routes/+layout.ts] => localeContext', localeContext.uiLocale);
        console.log('[routes/+layout.ts] => lang', lang);
    }

    const { systemConfig, siteConfig } = await fetch(`/api/v1/config?${new URLSearchParams({
        lang
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    return { systemConfig, siteConfig, localeContext, currentRoute: pathname };
}

// trailingSlash will be handled by hooks.server.ts
export const trailingSlash = 'ignore';