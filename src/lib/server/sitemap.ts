import { getPublicPostRaws } from "./posts";

/**
 * @param {string} date 
 * @returns 
 */
function formatDate(date: Date) {
    date = typeof date === 'string' ? new Date(date) : date;
    return date.toISOString().split('T')[0];
}

function build(site: any) {
    let postRaws = getPublicPostRaws(site);

    let map: any = {};

    let filteredPostRaws = postRaws
        .filter((post: any) => post.attributes?.visible)
        .filter((post: any) => {
            let robots = post.attributes?.robots;
            if (!robots) {
                return true;
            }
            if (robots.noindex
                || robots.indexOf('noindex') > -1) {
                return false;
            }
            return true;
        });

    let posts = filteredPostRaws.filter((post: any) => {
        if (map[post.attributes.url]) {
            return false;
        }
        map[post.attributes.url] = true;
        return true;
    });

    let taxonomies: string[] = [];
    filteredPostRaws.forEach((post: any) => {
        let createHandler = (prefix: string) => {
            return (taxonomy: string) => {
                if (map[taxonomy.toLowerCase()]) {
                    return;
                }
                map[taxonomy.toLowerCase()] = true;
                taxonomies.push(`/${prefix}/${taxonomy.toLowerCase()}/`);
            };
        };
        post.attributes.taxonomy?.category?.forEach(createHandler('category'));
        post.attributes.taxonomy?.tag?.forEach(createHandler('tag'));
        post.attributes.taxonomy?.series?.forEach(createHandler('series'));
        return taxonomies;
    });

    return { posts, taxonomies };
}

export { build, formatDate };
