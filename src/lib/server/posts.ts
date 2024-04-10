import { convertToPreview, loadAllPublicPostRaws } from "$lib/post/handle-posts";
import { fileWatch } from '$lib/server/file-watch';
import { sites } from './sites';

let postRawsOfSite: any = {};
let postsOfSite: any = {};
let lastLoadAt = 0;

function load() {
    for (const site of sites) {
        const { POSTS_DIR } = site.constants;

        const loadForSite = () => {
            const postRaws = loadAllPublicPostRaws(site);

            const posts = postRaws.map(raw => convertToPreview(raw));
            lastLoadAt = Date.now();

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

            postRawsOfSite[site.unique] = postRaws;
            postsOfSite[site.unique] = posts;
        }

        loadForSite();

        fileWatch(POSTS_DIR, loadForSite, `${site.unique}-load-posts`);
    }
}

load();

function getPosts(site: any) {
    return postsOfSite[site.unique] || [];
}

export { getPosts };

export function findRelatedPosts(site: any, post: any, limit = 3) {
    const weights = {
        category: 2,
        tag: 1,
        keywords: 2
    };

    const relatedPosts = getPosts(site)
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