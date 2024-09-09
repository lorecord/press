import { parse } from "node-html-parser";

export const extendRegionIndepents = (languages: string[]): {
    code: string;
    hreflang: string;
}[] => {
    let langs: {
        code: string;
        hreflang: string;
    }[] = [];
    const processedLanguages = new Set<string>();

    languages.forEach((lang) => {
        if (!processedLanguages.has(lang)) {
            langs.push({ code: lang, hreflang: lang });
            processedLanguages.add(lang);
        }

        const region = lang.split('-')[0];

        if (region && !processedLanguages.has(region)) {
            langs.push({ code: lang, hreflang: region });
            processedLanguages.add(region);
        }
    });

    return langs;
}

export const getHrefWithRelValue = (content: string, rel: string) => {
    const doc = parse(content);
    const links = doc.querySelectorAll(`link[rel="${rel}"]`);
    for (const link of links) {
        return link.getAttribute('href');
    }
    const as = doc.querySelectorAll(`a[rel="${rel}"]`);
    for (const a of as) {
        return a.getAttribute('href');
    }
}

export const addRelToExternalLinks = (html: string, baseUrl: string, internalDomains: string[]) => {

    if (internalDomains.length > 0) {
        html = html.replace(/<a\s([^>]*?)href=["']([\w-_+]+:\/\/[^"']*)["']([^>]*?)>/g, (match, beforeHref, hrefValue, afterHref) => {
            // Check if the link is external
            const url: { value?: URL } = {};
            try {
                url.value = new URL(hrefValue, baseUrl);
            } catch (e) {
                console.error(`Invalid URL: ${hrefValue}`);
                return match;
            }

            if (!internalDomains.includes(url.value?.hostname)) {
                // If external, add rel="external" if not already present
                let newLink = `<a ${beforeHref}href="${hrefValue}" ${afterHref}>`;
                if (!/rel=["'][^"']*\bexternal\b[^"']*["']/.test(newLink)) {
                    // add rel="external" to the link
                    if (/rel=["'][^"']*["']/.test(newLink)) {
                        newLink = newLink.replace(/rel=["'][^"']*["']/, (match) => {
                            return match.replace(/["']$/, ' external"');
                        });
                    } else {
                        newLink = newLink.replace(/>/, ' rel="external">');
                    }
                }
                return newLink;
            } else {
                // If internal, return the link unmodified
                return match;
            }
        });
    }

    return html;
}

export const addTargetBlankToExternalLinks = (html: string) => {
    // Use a regex to find all links with rel containing "external" and without a target attribute
    html = html.replace(/<a\s([^>]*?rel=["'][^"']*)\bexternal\b([^"']*["'][^>]*?)>/g, (match, beforeRel, afterRel) => {
        // Check if the link already has a target attribute
        if (/target=["'][^"']*["']/.test(beforeRel + afterRel)) {
            // If target exists, return the original match without modification
            return match;
        } else {
            // Otherwise, add target="_blank" to the link
            if (/rel=["'][^"']*\bnoopener\b[^"']*["']/.test(beforeRel + afterRel)) {
                return `<a ${beforeRel}external${afterRel} target="_blank">`;
            } else {
                return `<a ${beforeRel}external noopener${afterRel} target="_blank">`;
            }
        }
    });

    return html;
}

export function toAbsoluteURL(url: string, base: string) {
    try {
        return new URL(url, base).href;
    } catch (e) {
        console.error(e);
        return url;
    }
}