import { locale } from '$lib/translations';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { awaitChecker } from '$lib/browser';

export const load: PageLoad = async ({ params, parent, fetch, data }) => {
    
    let posts = fetch(`/api/v1/post?${new URLSearchParams({
        template: 'item',
        lang: locale.get(),
        limit: '8',
    })}`).then((r) => {
        if (r.ok) {
            return r.json();
        } else {
            error(r.status);
        }
    });

    const home = fetch(`/api/v1/post/home`).then((r) => {
        if(r.ok){
            return r.json();
        }
    });

    const needAwait = awaitChecker();

    return {
        home: needAwait ? await home : home,
        posts: needAwait ? await posts : posts
    };
} 