import { translations } from '$lib/translations';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    const { site, session, localeContext } = locals as any;
    return {
        site,
        session,
        localeContext,
        translations: translations.get()
    };
}