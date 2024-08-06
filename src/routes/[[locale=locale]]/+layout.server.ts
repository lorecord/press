import { dev } from "$app/environment";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals }) => {
    const { localeContext } = locals as any;

    const { locale: pathLocaleParam } = params;

    if (dev) {
        console.log('[routes/[[locale=locale]]/+layout.server.ts] pathLocaleParam', pathLocaleParam);
    }

    return {
        localeContext
    };
}