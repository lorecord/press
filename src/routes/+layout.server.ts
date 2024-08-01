import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    const { site, session } = locals as any;
    return {
        site,
        session
    };
}