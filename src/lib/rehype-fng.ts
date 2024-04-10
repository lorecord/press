import { visit } from 'unist-util-visit';
import { defaultFootnoteBackContent, defaultFootnoteBackLabel } from 'mdast-util-to-hast/lib/footer';
import { normalizeUri } from 'micromark-util-sanitize-uri'

const rehypeFng = () => (tree: any, file: any) => {
    const footer = tree.children[tree.children.length - 1];

    // delete original footer
    tree.children.splice(tree.children.length - 1, 1);

    tree.children.push(footer())

    const appendGroupedFootnotes = (group: any[], label: string) => {
        if (group?.length > 0) {
            tree.children.push({
                type: 'element',
                tagName: 'h2',
                properties: {},
                children: [{ type: 'text', value: label }],
            });

            group.forEach((note: any, idx) => {
                tree.children.push(note);
            });
        }
    }

    appendGroupedFootnotes(footnotes.references, 'Ref');
    appendGroupedFootnotes(footnotes.reads, 'Read');
    appendGroupedFootnotes(footnotes.notes, 'Note');
    appendGroupedFootnotes(footnotes.others, 'Others');
};

export default rehypeFng;