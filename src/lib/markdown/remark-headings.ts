import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

const remarkHeadings: Plugin = () => (tree: any, file: any) => {
    const headings: any = [];
    visit(tree, 'heading', (node, index, parent) => {
        const text = node.children.filter((c) => c.type === 'text')
            .map((c) => c.value).join('');

        headings.push({
            level: node.depth,
            text,
            id: node.data?.id // by remark-slug
        });
    });

    file.data.headings = headings;
};

export default remarkHeadings;