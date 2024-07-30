import { locale } from '$lib/translations';
import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ url, fetch, depends }) => {
    const { pathname } = url;
    depends('locale:locale');
    let lang = locale.get();
    const { systemConfig, siteConfig } = await fetch(`/api/v1/config?${new URLSearchParams({
        lang
    })}`).then((r) => r.json());

    return { systemConfig, siteConfig, currentRoute: pathname };
}

// trailingSlash will be handled by hooks.server.ts
export const trailingSlash = 'ignore';