import { parse } from "node-html-parser";

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