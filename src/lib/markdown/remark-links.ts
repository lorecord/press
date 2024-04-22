import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

// This plugin extracts external links from a markdown tree
const remarkLinks: Plugin = () => (tree: any, file: any) => {
    let links: { href: string, type: 'link' | 'reference' | 'citation' | 'reply' | 'translate' | 'bookmark', content?: string }[] = [];

    // `reference` means link to another webpage in footnote
    visit(tree, 'reference', (node: any) => {
        const href = node.url;
        const title = node.title || '';
        // The text content near to the link, contains text from sublings nodes of current node
        const text = node.sublings.map((n: any) => n.value).join('');

        console.log('reference', href);

        links.push({ href, type: 'reference' });
    })

    visit(tree, 'link', (node: any) => {
        const href = node.url;
        const title = node.title || '';
        let type: any = 'link';

        // The text content near to the link, contains text from sublings nodes of current node
        const text = node.sublings?.map((n: any) => n.value).join('');

        // `link` means link to another webpage in content but not in footnote

        if (links.find(({ href, type }) => href === href && type === 'reference')) {
            type = 'citation';
        }

        links.push({ href, type, content: text });
    });

    links = links
        .filter((link, index) => link.href.match(/^(https?|ftp):\/\//) && links.indexOf(link) === index)
        .filter((link) => !link.href.match(/^(https?|ftp):\/\/(localhost|127\.0\.0\.1|(.*\.)?example\.com)/));

    file.data.links = links;
};



export default remarkLinks;