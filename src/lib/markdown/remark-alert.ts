import type { Root } from 'mdast';
import type { Plugin, Transformer } from 'unified';
import { visit } from 'unist-util-visit';

export interface Options {
    classNamePrefix?: string;
    tagName?: string;
}

const remarkAlert: Plugin<[Options | undefined], Root> = (options = {}): void
    | Transformer<Root, Root> => {
    const { classNamePrefix = 'alert', tagName = 'div' } = options;

    const tranformer: Transformer<Root, Root> = (tree) => {
        const inserts: Function[] = [];
        let admonitions = ['Note', 'Abstract', 'Info', 'Tip', 'Success', 'Question', 'Warning', 'Failure', 'Danger', 'Bug', 'Example', 'Quote'].map((a) => a.toLowerCase());

        visit(tree, 'paragraph', (node, index, parent) => {
            if (node.children[0].type === 'text'
                && node.children[0].value.startsWith('!!!')) {
                const textNode = node.children[0];
                let rest = textNode.value.slice(3); // remove '!!!'
                let type = "info";
                let children = [];
                rest = rest.replace(/^\s+/, ''); // remove leading whitespace

                {
                    let foo = rest.split(/(?<=\w+)\s/);
                    let t = foo[0].toLowerCase();
                    if (admonitions.includes(t)) {
                        type = t;
                        children.push({
                            type: 'strong',
                            children: [{ type: 'text', value: foo[0] }],
                            data: {
                                hProperties: { className: [`alert-label`] }
                            },
                            position: textNode.position
                        });
                        if (foo.length > 1 && foo[1]) {
                            children.push({
                                type: 'text',
                                value: foo[1], position: textNode.position
                            });
                        }
                    } else {
                        children.push({ type: 'text', value: rest, position: textNode.position });
                    }
                }

                let newNode = {
                    type: 'alert',
                    data: {
                        hName: tagName,
                        hProperties: { className: [classNamePrefix, `${classNamePrefix}-${type}`] }
                    },
                    children: [...children, ...node.children.slice(1)]
                };
                inserts.push((({ parent, index, node }) => () => index != null && parent?.children.splice(index, 1, node))({ parent, index, node: newNode }));
            }
        });

        inserts.forEach((action) => action());
    }
    return tranformer;
}
export default remarkAlert;