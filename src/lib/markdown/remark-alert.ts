import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import { h } from 'hastscript';

const remarkAlert: Plugin = (options: any = {}) => {
    const { classNamePrefix = 'alert', tagName = 'div' } = options;

    return (tree: any) => {
        const inserts: any = [];
        let admonitions = ['Note', 'Abstract', 'Info', 'Tip', 'Success', 'Question', 'Warning', 'Failure', 'Danger', 'Bug', 'Example', 'Quote'].map((a) => a.toLowerCase());

        visit(tree, 'paragraph', (node, index, parent) => {
            if (node.children.length === 1
                && node.children[0].type === 'text'
                && node.children[0].value.startsWith('!!!')) {
                const textNode = node.children[0];
                let rest = textNode.value.slice(3); // remove '!!!'
                let type = "info";
                let children = [];
                rest = rest.replace(/^\s+/, ''); // remove leading whitespace

                {
                    let foo = rest.split(' ');
                    let t = foo[0].toLowerCase();
                    if (admonitions.includes(t)) {
                        type = t;
                        children.push(h('strong', {}, foo[0]));
                        children.push(h('span', {}, foo.slice(1).map((f: string) => ` ${f}`).join('')));
                    } else {
                        children.push(h('span', {}, rest));
                    }
                }

                let newNode = {
                    type: 'alert',
                    data: {
                        hName: tagName,
                        hProperties: { className: [classNamePrefix, `${classNamePrefix}-${type}`] },
                        hChildren: children
                    }
                };
                inserts.push({ index, parent, node: newNode });
            }
        });

        inserts.forEach(({ index, parent, node }) => {
            parent?.children.splice(index, 1, node);
        });
    }
}
export default remarkAlert;