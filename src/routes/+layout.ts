import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, fetch, depends }) => {
    const { pathname } = url;
    depends('locale:locale');
    let lang = locale.get();
    const { systemConfig, siteConfig } = await fetch(`/api/v1/config?${new URLSearchParams({
        lang
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    return { systemConfig, siteConfig, currentRoute: pathname };
}

// trailingSlash will be handled by hooks.server.ts
export const trailingSlash = 'ignore';