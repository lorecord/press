import { locale } from '$lib/translations';
import { awaitChecker } from '$lib/browser';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, depends, data }) => {
    depends('locale:locale');

    const { localeContext } = data;
    let {
        uiLocale
    } = localeContext;

    const posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'default|links',
        lang: locale.get() || uiLocale
    })}`)
        .then((r: Response) => r.ok ? r.json() : []);

    const needAwait = awaitChecker('layout');

    return { posts: needAwait ? await posts : posts };
}