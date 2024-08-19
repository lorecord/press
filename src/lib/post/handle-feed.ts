import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import type { Site } from "$lib/server/sites";
import { t } from "$lib/translations";
import { buildPostByMarkdown, handleAuthors } from "./handle-posts";
import type { PostRaw } from "./types";

export function convertToPostForFeed(site: Site, raw: PostRaw) {
    const { html: content, headings, links } = buildPostByMarkdown(raw?.body, raw.attributes.lang, (tree: any) => {
        // update footnote
        let handleChildren = (children: any[]) => {
            children.forEach((node: any) => {
                if (node.properties?.id) {
                    node.properties.id = node.properties.id.replace(/^(user-content-)+/, '');
                }
                if (node.type === 'element'
                    && 'a' === node.tagName
                    && node.properties?.href) {
                    node.properties.href = node.properties.href.replace(/^#(user-content-)+/, '#');
                }
                if (node.children) {
                    handleChildren(node.children);
                }
            });
        };
        handleChildren(tree.children);
    }, {
        mermaid: {
            enabled: false
        }
    });

    const systemConfig = getSystemConfig(site);
    const siteConfig = getSiteConfig(site, raw.attributes.lang || systemConfig.locale?.default);

    let feedContent = `${content}`;

    if (raw.attributes.langs) {
        feedContent = `${feedContent}
        <p>${raw.attributes.langs.map((lang: string) =>
            `<a rel="alternate" href="${siteConfig.url}/${lang}${raw.attributes.route}">${t.get(`lang.${lang}`)}</a>`)
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
            return `<li><a href="${siteConfig.url}${raw.attributes.route}#${node.id}">${node.text}</a>${children}</li>`;
        }).join('')}</ul>`
    }

    if (raw.attributes.toc && headings) {
        feedContent = `
        <h3>${t.get("common.toc")}</h3>
        ${toHTML(buildTree(headings as any[]))}
        ${feedContent}`;
    }

    handleAuthors(site, raw.attributes);

    return {
        ...raw?.attributes, content: feedContent, headings, links
    };
}