import { parse } from "node-html-parser";

export const findLinkInContent = (content: string, source: string, target: string, contentType: string): {
    title?:string,
    valid?: boolean;
    contentType?: string;
    type?: 'link' | 'media';
    responseContent?: string;
    linkText?: string;
    textAroundLink?: string;
} | undefined => {
    // if is html or json or text
    if (contentType?.includes('text/html')) {
        // check if content contains `a` with href to target, or image/audio/video/source with src to target
        const doc = parse(content);

        const links = doc.querySelectorAll('a[href]');

        for (const a of links) {
            // igore slash at end
            let href = a.getAttribute('href');
            let match = href == target;
            if (href && !match) {
                let hrefURL = new URL(href, source);
                if (!hrefURL.pathname.endsWith('/')) {
                    hrefURL.pathname += '/';
                }
                match = hrefURL.href == target;
            }
            if (match) {
                // the block parent node, div|p|h* etc
                let parentNode = a.parentNode;
                while (parentNode && !['div', 'section', 'article', 'p'].includes(parentNode.tagName.toLowerCase())) {
                    parentNode = parentNode.parentNode;
                }
                let textAroundLink = parentNode.previousSibling?.textContent + parentNode.textContent + parentNode.nextSibling?.textContent;
                return {
                    title: doc.querySelector('title')?.textContent,
                    valid: true,
                    contentType,
                    type: 'link',
                    responseContent: content,
                    linkText: a.textContent,
                    textAroundLink,
                };
            }
        }

        const media = doc.querySelectorAll('img[src], audio[src], video[src], source[src]');

        for (const m of media) {
            if (m.getAttribute('src') === target) {
                return {
                    valid: true,
                    contentType,
                    type: 'media',
                    responseContent: content
                };
            }
        }
    } else if (contentType?.includes('application/json')) {
        // In a JSON ([RFC7159]) document, the receiver should look for properties whose values are an exact match for the URL.
        const json = JSON.parse(content);

        function findAttributeValue(obj: any, value: any) {
            for (const key in obj) {
                if (obj[key] === value) {
                    return true;
                }
                if (typeof obj[key] === 'object') {
                    if (findAttributeValue(obj[key], value)) {
                        return true;
                    }
                } else if (Array.isArray(obj[key])) {
                    for (const item of obj[key]) {
                        if (findAttributeValue(item, value)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        if (findAttributeValue(json, target)) {
            return {
                valid: true,
                contentType,
                responseContent: content
            };
        }

    } else if (contentType?.includes('text/plain')) {
        // If the document is plain text, the receiver should look for the URL by searching for the string
        if (content.match(new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`))) {
            return {
                valid: true,
                contentType,
                responseContent: content
            };
        };
    } else {
        return {
            contentType,
            responseContent: content
        };
    }
}