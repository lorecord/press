import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import mermaid from 'mermaid';

const remarkMermaid: Plugin = (options: any = {}) => {
    const { enabled = false, svg = false } = options;

    return (tree: any, file: any) => {
        if (!enabled) return;

        visit(tree, 'code', (node, index, parent) => {
            if (node.lang === 'mermaid' && !/\braw\b/.test(node.meta)) {
                if (svg) {
                    // does not work bellow
                    node.type = 'svg';
                    let mermaidCode = node.value;
                    mermaid.mermaidAPI.render('mermaid-svg-' + index, mermaidCode, (svgCode: any) => {
                        console.log(svgCode);
                        node.value = svgCode;
                    });
                } else {
                    node.type = 'html';
                    node.value = `<div class="mermaid">${node.value}</div>`;

                    let processMeta = file.data.processMeta || (file.data.processMeta = {});
                    processMeta.mermaid = true;
                }
            }
        });
    }
};

export default remarkMermaid;