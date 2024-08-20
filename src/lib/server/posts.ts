import { getNativeInteractionsFilePath, loadNativeInteractions } from "$lib/interaction/handle-native";
import { convertToPost, loadAllPostRaws } from "$lib/post/handle-posts";
import type { PostRaw, Post } from "$lib/post/types";
import { handleRequestIndexNow } from "$lib/seo/handle-indexnow";
import { fileWatch } from '$lib/server/file-watch';
import path from 'path';
import { getEnvConfig, getSiteConfig, getSystemConfig } from "./config";
import { sites, type Site } from './sites';
import { sendWebmentions } from "$lib/interaction/handle-webmention";

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
                .map(raw => convertToPost(site, raw));
            lastLoadAt = Date.now();
            postRawsOfSite[site.unique] = postRaws;
            postsOfSite[site.unique] = posts;

            if (systemConfig.seo?.indexnow?.enabled && systemConfig.domains?.primary) {
                const siteConfig = getSiteConfig(site, systemConfig.locale?.default || 'en');

                let tasks = getPublicPostRaws(site)
                    .map((p: any) => ({
                        url: `${siteConfig.url}${p?.route}`,
                        folder: path.dirname(p?.path) || '',
                        modified: p?.modified?.date
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
                    // for test: only get posts after 2024-08-01
                    .map((p) => {
                        const siteConfig = getSiteConfig(site, p.lang || systemConfig.locale?.default || 'en');
                        const { links } = p.content || { links: [] };

                        let date = [p.modified?.date, p.published?.date, p.deleted?.date].map((d) => d ? new Date(d).getTime() : 0).filter((d) => d < Date.now()).sort((a, b) => b - a)[0];

                        return {
                            date: new Date(date),
                            route: p.route,
                            url: `${siteConfig.url}${p.route}`,
                            links: links.map((l) => ({ langs: [p.lang], ...l }))
                        }
                    });

                tasks = tasks.reduce((acc: any[], current) => {
                    let inAcc = acc.find((item: any) => item.route === current.route);
                    if (!inAcc) {
                        acc.push(current);
                    } else {
                        inAcc.date = inAcc.date.getTime() > current.date.getTime() ? inAcc.date : current.date;
                        inAcc.links = inAcc.links.concat(current.links);
                    }
                    return acc;
                }, []);

                // remove duplicate links
                tasks.forEach((t) => {
                    t.links = t.links.reduce((acc: any[], current: any) => {
                        let inAcc = acc.find((item: any) => item.href === current.href);
                        if (!inAcc) {
                            acc.push(current);
                        } else {
                            inAcc.langs = inAcc.langs.concat(current.langs);
                        }
                        return acc;
                    }, []);
                });

                tasks = tasks.filter((t: any) => t.links && t.links.length > 0);

                console.log(`[webmention] send webmentions for ${tasks.length} posts`);

                tasks.forEach((task: any) => {
                    let effectedRoute = task.route?.endsWith('/') ? task.route.substring(0, task.route.length - 1) : task.route;
                    sendWebmentions(site, effectedRoute, task.links.map((l: any) => l.href), task.date);
                });

                // TODO send pingback
            }

            // unique routes array
            const routes = Array.from(new Set(postRaws.map((raw: any) => raw.route)));

            routes.forEach((route: string) => {
                let effectedRoute = route?.endsWith('/') ? route.substring(0, route.length - 1) : route;
                function loadForRoute() {
                    loadNativeInteractions(site, { route: effectedRoute });
                }
                let interactionsFilePath = getNativeInteractionsFilePath(site, { route: effectedRoute });
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
    let published = getPublishedPostRaws(site);
    return published
        .filter((raw) => !(raw.deleted?.date && new Date(raw.deleted.date).getTime() < Date.now()));
}

/**
 * export post raws that are published, which could be public or private, even deleted, but not draft, scheduled, or future
*/
export function getPublishedPostRaws(site: Site) {
    return postRawsOfSite[site.unique]
        .filter((raw) => raw.routable)
        .filter((raw) => raw.published?.date && new Date(raw.published?.date).getTime() < Date.now())
        .map((raw) => {
            let newRaw = Object.assign({}, raw) as PostRaw;
            return newRaw;
        })
        || [];
}

export function getPublishedPosts(site: any) {
    const posts = postsOfSite[site.unique]
        .filter((p) => p.published?.date)
        .filter((p) => !p.deleted?.date)
        .filter((p) => p.published?.date && new Date(p.published.date).getTime() < Date.now())
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
    return getPublishedPosts(site).filter((raw) => !raw.deleted || !raw.deleted.date || new Date(raw.deleted.date).getTime() >= Date.now());
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