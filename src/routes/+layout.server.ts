import { locale, locales } from '$lib/translations';
import { getPreferredLangFromHeader } from '$lib/translations/utils';
import { selectedLocale } from '$lib/stores';

/** @type {import('./$types').LayoutServerLoad} */
export const load = async ({ url, params, cookies, request, locals }) => {

    const site = locals.site;
    const session = locals.session;

    return {
        site,
        session
    };
}