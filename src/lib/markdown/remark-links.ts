import { parse } from 'node-html-parser';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

// This plugin extracts external links from a markdown tree
const remarkLinks: Plugin = () => (tree: any, file: any) => {
    let links: {
        href: string,
        type: 'mention' | 'reference' | 'citation' | 'reply' | 'translate' | 'bookmark' | 'license' | 'tag' | 'mention' | 'like' | 'repost' | 'rsvp';
        content?: string,
    }[] = [];

    // `reference` means link to another webpage in footnote
    visit(tree, 'footnoteReference', (node: any) => {
    })

    visit(tree, 'footnoteDefinition', (node: any) => {
    })

    visit(tree, 'link', (node: any) => {
        const href = node.url;
        const title = node.title || '';
        let type: any = 'mention';

        // The text content near to the link, contains text from sublings nodes of current node
        const text = node.sublings?.map((n: any) => n.value).join('');

        // `link` means link to another webpage in content but not in footnote

        if (links.find(({ href, type }) => href === href && type === 'reference')) {
            type = 'citation';
        }

        links.push({ href, type, content: text });
    });

    visit(tree, 'html', (node: any) => {
        // abstract html nodes with tag `a`
        const doc = parse(node.value);
        const as = doc.querySelectorAll('a[href]');
        for (const a of as) {
            const href = a.getAttribute('href') as string;

            if (a.classList?.length > 0) {
                for (let className of a.classList.values()) {
                    if (className === 'u-in-reply-to') {
                        links.push({ href, type: 'reply', content: a.textContent as string });
                    } else if (className === 'u-repost-of') {
                        links.push({ href, type: 'repost', content: a.textContent as string });
                    } else if (className === 'u-like-of') {
                        links.push({ href, type: 'like', content: a.textContent as string });
                    } else if (className === 'u-bookmark-of') {
                        links.push({ href, type: 'bookmark', content: a.textContent as string });
                    } else if (className === 'u-tag-of') {
                        links.push({ href, type: 'tag', content: a.textContent as string });
                    } else if (className === 'u-license') {
                        links.push({ href, type: 'license', content: a.textContent as string });
                    } else if (className === 'u-mention') {
                        links.push({ href, type: 'mention', content: a.textContent as string });
                    } else if (className === 'u-rsvp') {
                        links.push({ href, type: 'rsvp', content: a.textContent as string });
                    } else if (className === 'u-translate') {
                        links.push({ href, type: 'translate', content: a.textContent as string });
                    } else if (className.startsWith('u-rsvp-')) {
                        links.push({ href, type: 'rsvp', content: a.textContent as string });
                    }
                }
            } else {
                if (a.classList?.length) {
                    console.log('a.classList', a.classList);
                }

                links.push({ href, type: 'mention', content: a.textContent as string });
            }
        }
    });

    links = links
        .filter((link, index) => link.href?.match(/^(https?|ftp):\/\//))
        // .filter((link) => !link.href.match(/^(https?|ftp):\/\/(localhost|127\.0\.0\.1|(.*\.)?example\.com)/));

    file.data.links = links;
};

export default remarkLinks;