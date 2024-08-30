import { getSiteConfig } from "$lib/server/config";
import type { Site } from "$lib/server/sites";
import { t } from "$lib/translations";
import { convertToPost } from "./handle-posts";
import type { Post, PostRaw } from "./types";

export function convertToPostForFeed(site: Site, raw: PostRaw) {
    let post: Post = convertToPost(site, raw, false);
    const siteConfig = getSiteConfig(site, post.lang);

    let feedHtml = `${post?.content?.html || ''}`;

    if (post.langs) {
        feedHtml = `${feedHtml}
        <p>${post.langs?.map((lang: string) =>
            `<a rel="alternate" href="${siteConfig.url}/${lang}${post.route}">${t.get(`lang.${lang}`)}</a>`)
            }</p>
        `;
    }

    function buildTree(data: any[]) {
        const result: any[] = [];
        const stack: any[] = [];

        data.forEach(item => {
            while (stack.length && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }

            const newNode = { ...item };
            if (stack.length) {
                const parent = stack[stack.length - 1];
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(newNode);
            } else {
                result.push(newNode);
            }

            stack.push(newNode);
        });

        return result;
    }

    function toHTML(tree: any[]) {
        return `<ul>${tree.map((node: any) => {
            let children: string = node.children ? toHTML(node.children) : '';
            return `<li><a href="${siteConfig.url}${raw.route}#${node.id}">${node.text}</a>${children}</li>`;
        }).join('')}</ul>`
    }

    if (post.toc?.enabled && post.content?.headings) {
        feedHtml = `
        <h3>${t.get("common.toc")}</h3>
        ${toHTML(buildTree(post.content?.headings as any[]))}
        ${feedHtml}`;
    }

    if (post.content) {
        post.content.html = feedHtml;
    } else {
        post.content = { html: feedHtml, headings: [], links: [], meta: {} };
    }


    return post;
}