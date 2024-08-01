import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ url, params, cookies, request, locals, parent }) => {
    const { localeContext } = locals as any;

    const { locale: pathLocaleParam } = params;

    console.log('[[locale=locale]] => pathLocaleParam', pathLocaleParam);

    return {
        localeContext
    };
}