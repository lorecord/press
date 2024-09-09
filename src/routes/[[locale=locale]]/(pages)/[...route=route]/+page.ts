import { awaitChecker } from "$lib/browser";
import type { Mention, Reply } from "$lib/interaction/types";
import type { Post } from "$lib/post/types";
import { locale } from "$lib/translations";
import { error, type MaybePromise } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch, depends, data, setHeaders }) => {
    depends('locale:locale');
    const { route, locale: localeParam } = params;
    const { localeContext, systemConfig, siteConfig } = data;

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

    const newer = Promise.resolve(post).then((post) => {
        let effectedRoute = post.newer && post.newer.endsWith('/') ? post.newer.substring(0, post.newer.length - 1) : post.newer;
        return effectedRoute && fetch(`/api/v1/post/${effectedRoute}${lang ? '?' + new URLSearchParams({
            lang
        }) : ''}`).then((r) => {
            if (r.ok) {
                return r.json()
            } else {
                return {};
            }
        })
    });

    const earlier = Promise.resolve(post).then((post) => {
        let effectedRoute = post.earlier && post.earlier.endsWith('/') ? post.earlier.substring(0, post.earlier.length - 1) : post.earlier;
        return effectedRoute && fetch(`/api/v1/post${effectedRoute}${lang ? '?' + new URLSearchParams({
            lang
        }) : ''}`).then((r) => {
            if (r.ok) {
                return r.json();
            } else {
                r.text().then((t) => {
                    console.log('earlier fetch failed', `/api/v1/post${effectedRoute}${lang ? '?' + new URLSearchParams({
                        lang
                    }) : ''}`, r.status, t);
                });
                return {};
            }
        });
    });

    const needAwait = awaitChecker();

    if (needAwait) {
        post.then((p: Post) => {

            if (!p) {
                console.error('No post data');
                return;
            }

            setHeaders({
                'Content-Language': p.lang || localeContext.contentLocale || systemConfig.locale.default || 'en'
            });

            let links: string[] = [];

            if (p.webmention?.enabled) {
                const endpoint = systemConfig.webmention.endpoint || `${siteConfig.url}/api/v1/webmention`;
                links.push(`<${endpoint}>; rel="webmention"`);
                setHeaders({
                    'X-Webmention': endpoint
                });
            }

            if (p?.pingback?.enabled) {
                const endpoint = systemConfig.pingback.endpoint || `${siteConfig.url}/api/v1/pingback`;
                links.push(`<${endpoint}>; rel="pingback"`);
                setHeaders({
                    'X-Pingback': endpoint
                });
            }

            if ((p?.langs?.length || 0) > 1) {
                links.push(`<${siteConfig.url}${p.route}>; rel="alternate"; hreflang="x-default"`);
                p?.langs?.forEach((lang: string) => {
                    links.push(`<${siteConfig.url}/${lang}${p.route}>; rel="alternate"; hreflang="${lang}"`);
                });

                if (localeContext.pathLocale && p?.lang && (p?.langs?.length || 0) > 1) {
                    links.push(`<${siteConfig.url}/${p.lang}${p.route}>; rel="canonical"`);
                } else {
                    links.push(`<${siteConfig.url}${p.route}>; rel="canonical"`);
                }
            }

            if (links.length > 0) {
                setHeaders({
                    'Link': links.join(', ')
                });
            }
        });
    }

    console.log('needAwait', needAwait);

    return {
        post: (needAwait ? await post : post) as MaybePromise<Post>,
        newer: (needAwait ? await newer : newer) as MaybePromise<Post>, earlier: (needAwait ? await earlier : earlier) as MaybePromise<Post>,
        interactions: {
            mentions: (needAwait ? await mentions : mentions) as MaybePromise<Mention[]>,
            replies: (needAwait ? await replies : replies) as MaybePromise<Reply[]>
        }
    };
}