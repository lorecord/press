import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

const remarkMathHelper: Plugin = (options: any = {}) => {
    const { enabled = true } = options;

    return (tree: any, file: any) => {
        if (!enabled) return;

        visit(tree, 'math', (node, index, parent) => {
            if (node.value) {
                let processMeta = file.data.processMeta || (file.data.processMeta = {});
                processMeta.katex = true;
                processMeta.math = true;
            }
        });
    }
};

export default remarkMathHelper;