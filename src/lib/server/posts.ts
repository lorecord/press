import { getNativeInteractionsFilePath, loadNativeInteractions } from "$lib/interaction/handle-native";
import { convertToPreview, loadAllPostRaws, type Raw } from "$lib/post/handle-posts";
import { handleRequestIndexNow } from "$lib/seo/handle-indexnow";
import { fileWatch } from '$lib/server/file-watch';
import { getEnvConfig, getSiteConfig, getSystemConfig } from "./config";
import { sites } from './sites';
import path from 'path';

let postRawsOfSite: any = {};
let postsOfSite: any = {};
let lastLoadAt = 0;

function load() {
    for (const site of sites) {
        const { POSTS_DIR } = site.constants;

        const loadForSite = () => {
            const systemConfig = getSystemConfig(site);
            const envConfig = getEnvConfig(site);
            const postRaws = loadAllPostRaws(site);

            const posts = postRaws
                .filter(raw => raw !== undefined)
                .map(raw => raw as Raw)
                .map(raw => convertToPreview(raw));
            lastLoadAt = Date.now();
            postRawsOfSite[site.unique] = postRaws;
            postsOfSite[site.unique] = posts;

            if (systemConfig.seo?.indexnow?.enabled && systemConfig.domains?.primary) {
                const siteConfig = getSiteConfig(site, systemConfig.locale?.default || 'en');

                let tasks = getPublishedPostRaws(site)
                    .map((p: any) => ({
                        url: `${siteConfig.url}${p?.attributes.url}`,
                        folder: path.dirname(p?.path) || '',
                        modified: p?.attributes?.modified?.date || p?.attributes?.date
                    }))
                    .filter((p: any) => p.folder);

                tasks = tasks.reduce((acc: any, current: any) => {
                    if (!acc.find((item: any) => item.url === current.url)) {
                        acc.push(current);
                    }
                    return acc;
                }, []);

                handleRequestIndexNow(tasks, {
                    key: envConfig.private?.INDEXNOW_KEY,
                    keyLocation: systemConfig.seo?.indexnow?.location,
                    host: systemConfig.domains?.primary,
                    dataFolder: site.constants.DATA_DIR
                });
            }

            // unique slugs array
            const slugs = Array.from(new Set(postRaws.map((raw: any) => raw.attributes?.slug)));

            slugs.forEach((slug: string) => {
                function loadForSlug() {
                    loadNativeInteractions(site, { slug });
                }
                let interactionsFilePath = getNativeInteractionsFilePath(site, { slug });
                if (interactionsFilePath) {
                    fileWatch(interactionsFilePath, loadForSlug, `${site.unique}-${slug}-load-interactions`);
                }
            });
        }

        loadForSite();

        fileWatch(POSTS_DIR, loadForSite, `${site.unique}-load-posts`);
    }
}

load();

export function getPublicPostRaws(site: any) {
    return getPublishedPostRaws(site)
        .filter((raw: any) => !raw.attributes?.deleted);
}

export function getPublishedPostRaws(site: any) {
    return postRawsOfSite[site.unique]
        .filter((raw: any) => raw.attributes?.routable)
        .filter((raw: any) => raw.attributes?.published)
        .filter((raw: any) => new Date(raw.attributes?.date).getTime() < Date.now())
        .map((raw: any) => {
            let attr = Object.assign({}, raw.attributes);
            delete attr.routable;
            delete attr.published;
            let newRaw = Object.assign({}, raw);
            return newRaw;
        })
        || [];
}

export function getPublishedPosts(site: any) {
    const posts = postsOfSite[site.unique]
        .filter((p: any) => p.routable)
        .filter((p: any) => p.published)
        .filter((p: any) => !p.deleted)
        .filter((p: any) => new Date(p.date).getTime() < Date.now())
        .filter((p: any) => {
            return true;
        })
        || [];

    {
        let prevOfTemplate: any = {};
        for (let i = 0; i < posts.length; i++) {
            let post = posts[i];

            if (post.template !== 'item') {
                continue;
            }

            let prev = prevOfTemplate[`${post.template}-${post.lang}`];
            if (prev) {
                if (post.slug === prev.slug) {
                    // multiple posts with same slug
                    continue;
                }
            }
            if (prev) {
                prev.earlier = post.slug;
                post.newer = prev.slug;
            }
            prevOfTemplate[`${post.template}-${post.lang}`] = post;
        }
    }

    return posts;
}

export function getPublicPosts(site: any) {
    return getPublishedPosts(site).filter((p: any) => !p.deleted);
}

export function getAllPosts(site: any) {
    return postsOfSite[site.unique] || [];
}

export function findRelatedPosts(site: any, post: any, limit = 3) {
    const weights = {
        category: 2,
        tag: 1,
        series: 3,
        keywords: 2
    };

    const relatedPosts = getPublicPosts(site)
        .filter((p: any) => p.template == 'item')
        .filter((p: any) => p.visible)
        .filter((p: any) => p.slug != post.slug)
        .filter((p: any) => p.lang == post.lang)
        .map((p: any) => {
            let score = 0;
            if (p.taxonomy?.tag && post.taxonomy?.tag) {
                score += p.taxonomy?.tag.filter((t: any) => post.taxonomy?.tag.includes(t)).length * weights.tag;
            }
            if (p.taxonomy?.category && post.taxonomy?.category) {
                score += p.taxonomy?.category.filter((c: any) => post.taxonomy?.category.includes(c)).length * weights.category;
            }
            if (p.taxonomy?.series && post.taxonomy?.series) {
                score += p.taxonomy?.series.filter((s: any) => post.taxonomy?.series.includes(s)).length * weights.series;
            }
            if (p.keywords && post.keywords) {
                score += p.keywords.filter((c: any) => post.keywords.includes(c)).length * weights.keywords;
            }
            return { post: p, score };
        })
        .filter((p: any) => p.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);
    return relatedPosts;
}