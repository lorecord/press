import { locale, locales } from '$lib/translations';
import { getPreferredLangFromHeader } from '$lib/translations/utils';
import { selectedLocale } from '$lib/stores';

/** @type {import('./$types').LayoutServerLoad} */
export const load = async ({ url, params, cookies, request, locals, parent }) => {
    const site = locals.site;

    const { system } = site;

    const cookieLang = cookies.get('locale');
    const pathLang = params.locale;
    const acceptLang = getPreferredLangFromHeader(request.headers.get('accept-language') || '', locales.get(), '');
    const defaultLang = system.locale?.default || 'en';
    const fallbackLang = 'en';
    const currentLang = locale.get();

    selectedLocale.set(cookieLang);

    return {
        translationContext: {
            cookieLang,
            pathLang,
            acceptLang,
            defaultLang,
            fallbackLang,
            currentLang
        },
        site
    };
}