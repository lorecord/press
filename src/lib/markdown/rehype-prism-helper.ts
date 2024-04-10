import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

const remarkPrismHelper: Plugin = (options: any = {}) => {
    const { enabled = true } = options;

    return (tree: any, file: any) => {
        if (!enabled) return;

        visit(tree, 'code', (node, index, parent) => {

            if (node.lang) {
                let processMeta = file.data.processMeta || (file.data.processMeta = {});
                processMeta.prism = true;
            }
        });
    }
};

export default remarkPrismHelper;