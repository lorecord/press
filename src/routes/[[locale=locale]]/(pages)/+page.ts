import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { awaitChecker } from '$lib/browser';
import type { Post } from '$lib/post/types';

export const load: PageLoad = async ({ depends, fetch, params, data, setHeaders }) => {
    const { locale: pathLocaleParam } = params;
    const { localeContext, systemConfig } = data;

    let limit = 8;

    depends('locale:locale');
    let posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: pathLocaleParam || locale.get() || localeContext.contentLocale,
        limit: `${limit}`,
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const home = fetch(`/api/v1/post/home?${new URLSearchParams({
        lang: pathLocaleParam || locale.get()
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        }
    });

    const needAwait = awaitChecker();

    if (needAwait) {
        home.then((p: Post) => {
            let links: string[] = [];

            if (p.webmention?.enabled) {
                const endpoint = systemConfig.webmention.endpoint || '/api/v1/webmention';
                links.push(`<${endpoint}>; rel="webmention"`);
                setHeaders({
                    'X-Webmention': endpoint
                });
            }

            if (p?.pingback?.enabled) {
                const endpoint = systemConfig.pingback.endpoint || '/api/v1/pingback';
                links.push(`<${endpoint}>; rel="pingback"`);
                setHeaders({
                    'X-Pingback': endpoint
                });
            }

            if (links.length > 0) {
                setHeaders({
                    'Link': links.join(', ')
                });
            }
        });
    }

    return {
        home: needAwait ? await home : home,
        posts: needAwait ? await posts : posts,
        limit
    };
} 