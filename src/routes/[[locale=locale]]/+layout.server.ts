import { dev } from "$app/environment";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals }) => {
    const { localeContext } = locals as any;

    return {
        localeContext
    };
}