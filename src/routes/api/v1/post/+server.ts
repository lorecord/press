import { json } from '@sveltejs/kit';
import { getPosts } from "$lib/server/posts";
import { getSystemConfig } from '$lib/server/config.js';

export function GET({ url, locals }) {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    const template = url.searchParams.get('template');
    const tag = url.searchParams.get('tag');
    const category = url.searchParams.get('category');
    const limit = url.searchParams.get('limit');
    let lang: string | null = url.searchParams.get('lang');

    let collection = getPosts(site);

    if (template) {
        const templates = template.split('|');
        collection = collection.filter((p: any) => templates.indexOf(p.template) >= 0);
    }

    if (tag) {
        collection = collection.filter((p: any) => p.taxonomy?.tag?.some((t: any) => t.toLowerCase() === tag.toLowerCase()));
    }
    if (category) {
        collection = collection.filter((p: any) => p.taxonomy?.category?.some((t: any) => t.toLowerCase() == category.toLowerCase()));
    }

    if (!lang || lang === 'undefined' || lang === 'null') {
        lang = systemConfig.locale?.default || 'en';
    }

    collection = collection.filter((p: any) => !p.lang || p.lang?.toLowerCase() === lang?.toLowerCase());

    if (limit && parseInt(limit) > 0) {
        collection = collection.slice(0, parseInt(limit));
    }

    return json(collection);
}