import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals }) => {
    const { localeContext } = locals;

    return {
        localeContext
    };
}