import { error } from "@sveltejs/kit";
import { locale } from "$lib/translations";
import type { PageLoad } from "./$types";
import { awaitChecker } from "$lib/browser";
import { browser } from "$app/environment";
import { getSystemConfig } from "$lib/server/config";

export const load: PageLoad = async ({ params, fetch, depends, data, locals, setHeaders }) => {
    depends('locale:locale');
    const { route, locale: localeParam } = params;
    const { localeContext } = data;
    const { site } = locals as any;

    let lang = localeParam || locale.get() || localeContext.contentLocale;

    const systemConfig = getSystemConfig(site);

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
        post?.comment?.enable && fetch(`/api/v1/interaction/${effectedRoute}`).then((r) => {
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
        if (systemConfig.webmention.enabled) {
            post.then((p) => {
                setHeaders({
                    'Link': `<${systemConfig.webmention.endpoint || '/api/v1/webmention'} >; rel = "webmention"`
                });
            })
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