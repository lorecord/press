import { error } from "@sveltejs/kit";
import { locale } from "$lib/translations";
import { derived, get, writable } from "svelte/store";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
    const { ldjson } = await parent();

    let { route } = params;
    let lang = params.locale || locale.get();
    const derivedLang = derived(locale, ($locale) => params.locale || $locale);

    if (route?.endsWith('/')) {
        route = route.substring(0, route.length - 1);
    }

    const newer = writable();
    const earlier = writable();

    const post = await fetch(`/api/v1/post/${route}${lang ? '?' + new URLSearchParams({
        lang: get(derivedLang)
    }) : ''}`).then((r) => {
        if (r.ok) {
            return r.json()
        }
    });

    if (!post?.content) {
        error(404);
    }
    if (!post?.published) {
        error(409); // Gone
    }

    const comments = post?.comment?.enable ? await fetch(`/api/v1/discuss/${route}`).then((r) => r.json()) : undefined;

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

    return { post, newer, earlier, comments, ldjson };
}