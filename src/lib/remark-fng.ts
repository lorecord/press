import { visit } from 'unist-util-visit';

const remarkFng = () => (tree: any) => {
    visit(tree, 'footnoteDefinition', (node, index, parent) => {
    });
};

export default remarkFng;