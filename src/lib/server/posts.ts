import { convertToPreview, loadAllPostRaws, type Raw } from "$lib/post/handle-posts";
import { handleRequestIndexNow } from "$lib/seo/handle-indexnow";
import { fileWatch } from '$lib/server/file-watch';
import { getEnvConfig, getSiteConfig, getSystemConfig } from "./config";
import { sites } from './sites';
import { getWorkerPool } from "./worker/init";

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
                        folder: p?.path || '',
                        modified: p?.attributes?.date || p?.attributes?.modified?.date
                    }))
                    .filter((p: any) => p.folder);

                tasks = tasks.reduce((acc: any, current: any) => {
                    if (!acc.find((item: any) => item.url === current.url)) {
                        acc.push(current);
                    }
                    return acc;
                }, {});

                handleRequestIndexNow(tasks, {
                    key: envConfig.INDEXNOW_KEY,
                    keyLocation: systemConfig.indexnow.location,
                    host: systemConfig.domains?.primary,
                    dataFolder: site.constants.DATA_DIR
                });
            }
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
        .filter((raw: any) => {
            let attr = raw.attributes;
            delete attr.routable;
            delete attr.published;
            return true;
        })
        || [];
}

export function getPublishedPosts(site: any) {
    const posts = postsOfSite[site.unique]
        .filter((p: any) => p.routable)
        .filter((p: any) => p.published)
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
        keywords: 2
    };

    const relatedPosts = getPublicPosts(site)
        .filter(p => p.template == 'item')
        .filter(p => p.visible)
        .filter(p => p.slug != post.slug)
        .filter(p => p.lang == post.lang)
        .map(p => {
            let score = 0;
            if (p.taxonomy?.tag && post.taxonomy?.tag) {
                score += p.taxonomy?.tag.filter(t => post.taxonomy?.tag.includes(t)).length * weights.tag;
            }
            if (p.taxonomy?.category && post.taxonomy?.category) {
                score += p.taxonomy?.category.filter(c => post.taxonomy?.category.includes(c)).length * weights.tag;
            }

            if (p.keywords && post.keywords) {
                score += p.keywords.filter(c => post.keywords.includes(c)).length * weights.keywords;
            }
            return { post: p, score };
        })
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    return relatedPosts;
}