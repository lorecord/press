import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, params, cookies, request, locals }) => {

    const site = locals.site;
    const session = locals.session;

    return {
        site,
        session
    };
}