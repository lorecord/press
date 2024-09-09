import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    const { localeContext } = locals;

    return {
        localeContext
    };
}