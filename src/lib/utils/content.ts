import { parse } from "node-html-parser";

export const findLinkInContent = (content: string, source: string, target: string, contentType: string) => {
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
                return {
                    valid: true,
                    contentType,
                    type: 'link',
                    responseText: content
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
                    responseText: content
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
                responseText: content
            };
        }

    } else if (contentType?.includes('text/plain')) {
        // If the document is plain text, the receiver should look for the URL by searching for the string
        if (content.match(new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`))) {
            return {
                valid: true,
                contentType,
                responseText: content
            };
        };
    } else {
        return {
            contentType,
            responseText: content
        };
    }
}