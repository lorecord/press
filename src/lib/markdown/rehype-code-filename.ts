import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import { h } from 'hastscript';

const rehypeCodeFilename: Plugin = () => (tree: any, file: any) => {
    const inserts: any = [];
    visit(tree, 'element', (node: any, index: number, parent: any) => {
        if (node.tagName === 'code' && node.data?.meta) {
            const meta = node.data.meta;
            const filenameMatch = meta.match(/filename[:=]\s*"([^"]*)"\s*/);
            if (filenameMatch) {
                const filename = filenameMatch[1];
                const filenameNode = h('cite.filename', { className: 'code-filename filename' }, filename);
                inserts.push({ index, parent, node: filenameNode });
            }
        }
    });

    inserts.forEach(({ index, parent, node }) => {
        parent?.children.splice(index, 0, node);
    });
};

export default rehypeCodeFilename;