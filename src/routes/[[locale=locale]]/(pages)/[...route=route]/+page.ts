import { error } from "@sveltejs/kit";
import { locale } from "$lib/translations";
import { derived, get, writable } from "svelte/store";
import { browser } from "$app/environment";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    const { } = await parent();

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
        post?.comment?.enable && fetch(`/api/v1/interaction/${route}`).then((r) => r.json())
    );

    const replies = Promise.resolve(interactions).then(interactions => interactions?.replies || []);
    const mentions = Promise.resolve(interactions).then(interactions => interactions?.mentions || []);

    const newer = Promise.resolve(post).then((post) => post.newer && fetch(`/api/v1/post/${post.newer}${get(derivedLang) ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json()
        }
    }));

    const earlier = Promise.resolve(post).then((post) => post.earlier && fetch(`/api/v1/post/${post.earlier}${get(derivedLang) ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json();
        }
    }));

    return {
        post: browser ? post : await post,
        newer: browser ? newer : await newer,
        earlier: browser ? earlier : await earlier,
        interactions: {
            mentions: browser ? mentions : await mentions,
            replies: browser ? replies : await replies
        }
    };
}