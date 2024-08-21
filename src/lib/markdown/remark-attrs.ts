import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

const remarkAttrs: Plugin = () => (tree: any, file: any) => {
    visit(tree, ['text'], (node, index, parent) => {
        const [_, beforeAttrs, attrs, afterAttrs] =
            node.value.match(/^(.*)(\{.*\})(.*)/) || [];

        if (attrs) {
            let parsedAttrs: {
                [key: string]: string;
            } = {};
            const attrDefs = attrs.slice(1, -1).split(/(\s|,|\s,)/);
            for (let i = 0; i < attrDefs.length; i += 2) {
                if (attrDefs[i].startsWith('.')) {
                    parsedAttrs['class'] = attrDefs[i].slice(1);
                } else if (attrDefs[i].startsWith('#')) {
                    parsedAttrs['id'] = attrDefs[i].slice(1);
                } else {
                    const [, attr, value] = attrDefs[i]?.match(/(.*)=(.*)/) || [];
                    if (attr && value) {
                        parsedAttrs[attr] = value;
                    }
                }
            }

            let targetNode = null;

            if (index && index > 0) {
                const prevSibling = parent.children[index - 1];
                targetNode = prevSibling;
            }

            if (!targetNode) {
                targetNode = parent;
            }

            targetNode.data = targetNode.data || {};
            targetNode.data.hProperties = {
                ...targetNode.data.hProperties,
                ...parsedAttrs
            }
            node.value = (beforeAttrs || '') + (afterAttrs || '');
        }
    });
};

export default remarkAttrs;