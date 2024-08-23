import { visit } from 'unist-util-visit';
import type { Node, Data } from 'unist';
import type { Plugin } from 'unified';

const remarkAttrs: Plugin = () => (tree, file: any) => {
    visit(tree, ['text'], (node, index, parent: Node | undefined) => {
        const [_, beforeAttrs, attrs, afterAttrs] =
            (node as any).value.match(/^(.*)(\{.*\})(.*)/) || [];

        if (attrs) {
            let parsedAttrs: {
                [key: string]: string;
            } = {};
            const attrDefs = attrs.slice(1, -1).split(/(\s|,|\s,)/);

            for (let i = 0; i < attrDefs.length; i += 2) {
                if (attrDefs[i].startsWith('.')) {
                    parsedAttrs['class'] = parsedAttrs['class']
                        ? parsedAttrs['class'] + ' ' + attrDefs[i].slice(1)
                        : attrDefs[i].slice(1);

                } else if (attrDefs[i].startsWith('#')) {
                    parsedAttrs['id'] = attrDefs[i].slice(1);
                } else {
                    const [, attr, value] = attrDefs[i]?.match(/(.*)="?([^"]*)"?/) || [];
                    if (attr && value) {
                        if (["rel"].includes(attr)) {
                            parsedAttrs['rel'] = parsedAttrs['rel']
                                ? parsedAttrs['rel'] + ' ' + value
                                : value;
                        }
                        parsedAttrs[attr] = value;
                    }
                }
            }

            let targetNode = null;

            if (index && index > 0 && parent) {
                const prevSibling = (parent as any).children[index - 1];
                targetNode = prevSibling;
            }

            if (!targetNode) {
                targetNode = parent;
            }

            targetNode.data = targetNode.data || {};
            const { class: clazz, rel, ...restParsedAttrs } = parsedAttrs;
            let specialAttrs: any = {};

            if (clazz) {
                specialAttrs.class = targetNode.data.hProperties?.class ? targetNode.data.hProperties.class + ' ' + clazz : clazz;
                specialAttrs.rel = targetNode.data.hProperties?.rel ? targetNode.data.hProperties.rel + ' ' + rel : rel;
            }

            targetNode.data.hProperties = {
                ...targetNode.data.hProperties,
                ...specialAttrs,
                ...restParsedAttrs
            };

            (node as any).value = (beforeAttrs || '') + (afterAttrs || '');
        }
    });
};

export default remarkAttrs;