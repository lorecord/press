import { error } from "@sveltejs/kit";
import { locale } from "$lib/translations";
import { derived, get, writable } from "svelte/store";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    const { } = await parent();

    let { route } = params;
    let lang = params.locale || locale.get();
    const derivedLang = derived(locale, ($locale) => params.locale || $locale);

    if (route?.endsWith('/')) {
        route = route.substring(0, route.length - 1);
    }

    const newer = writable();
    const earlier = writable();

    const { status, json: post }: { status: number, json: any } = await fetch(`/api/v1/post/${route}${lang ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json().then(json => ({ status: r.status, json }));
        } else {
            return { status: r.status, json: {} };
        }
    });

    if (!post) {
        error(status);
    }

    const { replies, mentions } = post?.comment?.enable ? await fetch(`/api/v1/interaction/${route}`).then((r) => r.json()) : { replies: [], mentions: [] };

    post.newer && await fetch(`/api/v1/post/${post.newer}${get(derivedLang) ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json()
        }
    }).then(json => newer.set(json));

    post.earlier && await fetch(`/api/v1/post/${post.earlier}${get(derivedLang) ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json()
        }
    }).then(json => earlier.set(json));

    return {
        post, newer, earlier, interactions: { replies, mentions }
    };
}