import { error } from "@sveltejs/kit";
import { locale } from "$lib/translations";
import { derived, get, writable } from "svelte/store";
import type { PageLoad } from "./$types";
import { awaitChecker } from "$lib/browser";

export const load: PageLoad = async ({ params, fetch, depends}) => {
    depends('locale:locale');
    let { route } = params;
    let lang = params.locale || locale.get();
    const derivedLang = derived(locale, ($locale) => params.locale || $locale);

    if (route?.endsWith('/')) {
        route = route.substring(0, route.length - 1);
    }

    const post = fetch(`/api/v1/post/${route}${lang ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const interactions = Promise.resolve(post).then((post) =>
        post?.comment?.enable && fetch(`/api/v1/interaction/${route}`).then((r) => {
            if (r.ok) {
                return r.json();
            } else {
                return { replies: [], mentions: [] };
            }
        })
    );

    const replies = Promise.resolve(interactions).then(interactions => interactions?.replies || []);
    const mentions = Promise.resolve(interactions).then(interactions => interactions?.mentions || []);

    const newer = Promise.resolve(post).then((post) => post.newer && fetch(`/api/v1/post/${post.newer}${get(derivedLang) ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json()
        } else {
            return {};
        }
    }));

    const earlier = Promise.resolve(post).then((post) => post.earlier && fetch(`/api/v1/post/${post.earlier}${get(derivedLang) ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            return {};
        }
    }));

    const needAwait = awaitChecker();

    console.log('needAwait', needAwait);

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