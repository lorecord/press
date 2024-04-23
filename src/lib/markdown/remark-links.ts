import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import { parse } from 'node-html-parser';

// This plugin extracts external links from a markdown tree
const remarkLinks: Plugin = () => (tree: any, file: any) => {
    let links: { href: string, type: 'link' | 'reference' | 'citation' | 'reply' | 'translate' | 'bookmark', content?: string }[] = [];

    // `reference` means link to another webpage in footnote
    visit(tree, 'footnoteReference', (node: any) => {
    })

    visit(tree, 'footnoteDefinition', (node: any) => {
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

    visit(tree, 'html', (node: any) => {
        // abstract html nodes with tag `a`
        const doc = parse(node.value);
        const as = doc.querySelectorAll('a[href]');
        for (const a of as) {
            const href = a.getAttribute('href') as string;
            links.push({ href, type: 'link', content: a.textContent as string });
        }
    });

    links = links
        .filter((link, index) => link.href?.match(/^(https?|ftp):\/\//) && links.indexOf(link) === index)
        .filter((link) => !link.href.match(/^(https?|ftp):\/\/(localhost|127\.0\.0\.1|(.*\.)?example\.com)/));

    file.data.links = links;

    if(links.length){
        console.log('links', links.length, links.map(l => l.href).join('\n'));
    }
};



export default remarkLinks;