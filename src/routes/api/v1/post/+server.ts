import { json } from '@sveltejs/kit';
import { getPublicPosts } from "$lib/server/posts";
import { getSystemConfig } from '$lib/server/config.js';
import { dev } from '$app/environment';

export async function GET({ url, locals }) {
    const { site } = locals as { site: any };
    const systemConfig = getSystemConfig(site);

    const template = url.searchParams.get('template');
    const tag = url.searchParams.get('tag');
    const category = url.searchParams.get('category');
    const series = url.searchParams.get('series');
    const limit = url.searchParams.get('limit');
    let lang: string | null = url.searchParams.get('lang');

    if(dev){
        console.log('[api/v1/post] GET', { template, tag, category, series, limit, lang });
    }

    let collection = getPublicPosts(site);

    if (template) {
        const templates = template.split('|');
        collection = collection.filter((p: any) => templates.indexOf(p.template) >= 0);
    }

    if (tag) {
        collection = collection.filter((p: any) => p.taxonomy?.tag?.some((t: any) => t.toLowerCase().replace(/\s+/gm, '-') === tag.toLowerCase().replace(/\s+/gm, '-')));
    }
    if (category) {
        collection = collection.filter((p: any) => p.taxonomy?.category?.some((t: any) => t.toLowerCase().replace(/\s+/gm, '-') == category.toLowerCase().replace(/\s+/gm, '-')));
    }
    if (series) {
        collection = collection.filter((p: any) => p.taxonomy?.series?.some((t: any) => t.toLowerCase().replace(/\s+/gm, '-') == series.toLowerCase().replace(/\s+/gm, '-')));
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