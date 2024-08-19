import { getNativeInteractionsFilePath, loadNativeInteractions } from "$lib/interaction/handle-native";
import { convertToPost, loadAllPostRaws } from "$lib/post/handle-posts";
import type { PostRaw, Post } from "$lib/post/types";
import { handleRequestIndexNow } from "$lib/seo/handle-indexnow";
import { fileWatch } from '$lib/server/file-watch';
import path from 'path';
import { getEnvConfig, getSiteConfig, getSystemConfig } from "./config";
import { sites } from './sites';

let postRawsOfSite: {
    [siteUnique: string]: PostRaw[];
} = {};
let postsOfSite: {
    [siteUnique: string]: Post[];
} = {};
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
                .map(raw => raw as PostRaw)
                .map(raw => convertToPost(site, raw));
            lastLoadAt = Date.now();
            postRawsOfSite[site.unique] = postRaws;
            postsOfSite[site.unique] = posts;

            if (systemConfig.seo?.indexnow?.enabled && systemConfig.domains?.primary) {
                const siteConfig = getSiteConfig(site, systemConfig.locale?.default || 'en');

                let tasks = getPublicPostRaws(site)
                    .map((p: any) => ({
                        url: `${siteConfig.url}${p?.attributes.route}`,
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

            if (systemConfig.webmention?.enabled) {

                let tasks = getPublicPosts(site)
                    .map((p) => {
                        const siteConfig = getSiteConfig(site, p.lang || systemConfig.locale?.default || 'en');
                        const { links } = p;
                        return {
                            route: p.route,
                            url: `${siteConfig.url}${p.route}`,
                            links
                        }
                    });

                tasks = tasks.reduce((acc: any, current: any) => {
                    let inAcc = acc.find((item: any) => item.route === current.route);
                    if (!inAcc) {
                        acc.push(current);
                    } else {
                        inAcc.links = inAcc.links.concat(current.links);
                    }
                    return acc;
                }, []);

                tasks = tasks.filter((t: any) => t.links && t.links.length > 0);

                tasks.forEach((task: any) => {
                    console.log(`${task.route} links to`, task.links);
                });
            }

            // unique routes array
            const routes = Array.from(new Set(postRaws.map((raw: any) => raw.attributes?.route)));

            routes.forEach((route: string) => {
                function loadForRoute() {
                    loadNativeInteractions(site, { route });
                }
                let interactionsFilePath = getNativeInteractionsFilePath(site, { route });
                if (interactionsFilePath) {
                    fileWatch(interactionsFilePath, loadForRoute, `${site.unique}-${route}-load-interactions`);
                }
            });
        }

        loadForSite();

        fileWatch(POSTS_DIR, loadForSite, `${site.unique}-load-posts`);
    }
}

load();

/**
 * export post raws that are public
 */
export function getPublicPostRaws(site: any) {
    return getPublishedPostRaws(site)
        .filter((raw: any) => !raw.attributes?.deleted);
}

/**
 * export post raws that are published, which could be public or private, even deleted, but not draft, scheduled, or future
*/
export function getPublishedPostRaws(site: any) {
    return postRawsOfSite[site.unique]
        .filter((raw) => raw.attributes?.routable)
        .filter((raw) => raw.attributes?.published)
        .filter((raw) => new Date(raw.attributes?.date).getTime() < Date.now())
        .map((raw: any) => {
            let attr = Object.assign({}, raw.attributes);
            delete attr.routable;
            delete attr.published;
            let newRaw = Object.assign({}, raw) as PostRaw;
            return newRaw;
        })
        || [];
}

export function getPublishedPosts(site: any) {
    const posts = postsOfSite[site.unique]
        .filter((p) => p.routable)
        .filter((p) => p.published)
        .filter((p) => !p.deleted)
        .filter((p) => p.date && new Date(p.date).getTime() < Date.now())
        .filter((p) => {
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
                if (post.route === prev.route) {
                    // multiple posts with same route
                    continue;
                }
            }
            if (prev) {
                prev.earlier = post.route;
                post.newer = prev.route;
            }
            prevOfTemplate[`${post.template}-${post.lang}`] = post;
        }
    }

    return posts;
}

export function getPublicPosts(site: any) {
    return getPublishedPosts(site).filter((p) => !p.deleted);
}

export function findRelatedPosts(site: any, post: any, limit = 3) {
    const weights = {
        category: 2,
        tag: 1,
        series: 3,
        keywords: 2
    };

    const relatedPosts = getPublicPosts(site)
        .filter((p) => p.template == 'item')
        .filter((p) => p.visible)
        .filter((p) => p.route != post.route)
        .filter((p) => p.lang == post.lang)
        .map((p) => {
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