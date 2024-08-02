import { dev } from "$app/environment";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals }) => {
    const { localeContext } = locals as any;

    if (dev) {
        const { locale: pathLocaleParam } = params;
        console.log('[routes/[[locale=locale]]/+layout.server.ts] pathLocaleParam', pathLocaleParam);
    }

    return {
        localeContext
    };
}