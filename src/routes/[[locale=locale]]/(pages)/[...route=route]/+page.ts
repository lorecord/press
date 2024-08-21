import { error } from "@sveltejs/kit";
import { locale } from "$lib/translations";
import type { PageLoad } from "./$types";
import { awaitChecker } from "$lib/browser";
import { browser } from "$app/environment";

export const load: PageLoad = async ({ params, fetch, depends, data, setHeaders }) => {
    depends('locale:locale');
    const { route, locale: localeParam } = params;
    const { localeContext, systemConfig } = data;

    let lang = localeParam || locale.get() || localeContext.contentLocale;

    let effectedRoute = route?.endsWith('/') ? route.substring(0, route.length - 1) : route;

    const post = fetch(`/api/v1/post/${effectedRoute}${lang ? '?' + new URLSearchParams({
        lang
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const interactions = Promise.resolve(post).then((post) =>
        post?.comment?.enabled && fetch(`/api/v1/interaction/${effectedRoute}`).then((r) => {
            if (r.ok) {
                return r.json();
            } else {
                return { replies: [], mentions: [] };
            }
        })
    );

    const replies = Promise.resolve(interactions).then(interactions => interactions?.replies || []);
    const mentions = Promise.resolve(interactions).then(interactions => interactions?.mentions || []);

    const newer = Promise.resolve(post).then((post) => post.newer && fetch(`/api/v1/post/${post.newer}${lang ? '?' + new URLSearchParams({
        lang
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json()
        } else {
            return {};
        }
    }));

    const earlier = Promise.resolve(post).then((post) => post.earlier && fetch(`/api/v1/post/${post.earlier}${lang ? '?' + new URLSearchParams({
        lang
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            return {};
        }
    }));

    const needAwait = awaitChecker();

    if (browser) {
        console.log('needAwait', needAwait);
    }

    if (needAwait) {
        // TODO fix this
        let links: string[] = [];

        if (systemConfig?.webmention.enabled) {
            const endpoint = systemConfig.webmention.endpoint || '/api/v1/webmention';
            links.push(`<${endpoint}>; rel="webmention"`);
            setHeaders({
                'X-Webmention': endpoint
            });
        }

        if (systemConfig?.pingback.enabled) {
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
    }

    return {
        post: needAwait ? await post : post,
        newer: needAwait ? await newer : newer,
        earlier: needAwait ? await earlier : earlier,
        interactions: {
            mentions: needAwait ? await mentions : mentions,
            replies: needAwait ? await replies : replies
        }
    };
}