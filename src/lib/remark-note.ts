import type { Plugin } from 'unified';
import type { Parent, Text } from 'mdast';
import type { Visitor } from 'unist-util-visit';
import { visit } from 'unist-util-visit';

interface NoteNode extends Parent {
    type: 'note';
    children: [Text];
}
const remarkNote: Plugin = (options: any = {}) => {
    const { noteHeadingText = 'Note' } = options;

    return (tree) => {
        const notes: NoteNode[] = [];
        const visitor: Visitor<Text> = (node, index, parent) => {
            if (index === null) {
                return;
            }
            // [#note]
            const regex = /\[#([\w_-]+)\]/g;
            let match;

            while ((match = regex.exec(node.value))) {
                console.log('matched', node.value);
                const noteText = match[1];

                const noteNode: NoteNode = {
                    type: 'note',
                    children: [{ type: 'text', value: noteText }],
                };

                notes.push(noteNode);

                const reference = `<sup><a href="#noteref-${noteText}" id="note-${noteText}" aria-describedby="footnote-label">#${notes.length}</a><sup>`;

                parent?.children.splice(index, 1, {
                    type: 'html',
                    value: reference,
                });

                index++;
            }
        };

        visit(tree, 'text', visitor);

        visit(tree, 'linkReference', (note: any) => {
            console.log('linkReference', note);
        });

        if (notes.length > 0) {
            const noteSection: Parent = {
                type: 'section',
                data: { hName: 'section' },
                children: [
                    { type: 'heading', depth: 2, children: [{ type: 'text', value: noteHeadingText }] },
                    {
                        type: 'list',
                        children: notes.map((note) => {
                            const noteText = (note.children[0] as Text).value;
                            return {
                                type: 'listItem',
                                data: { hProperties: { id: `noteref-${noteText}` } },
                                children: [
                                    {
                                        type: 'paragraph',
                                        children: [
                                            {
                                                type: 'text',
                                                value: noteText,
                                            },
                                        ],
                                    },
                                    {
                                        type: 'link',
                                        url: `#note-${noteText}`,
                                        children: [
                                            {
                                                type: 'text',
                                                value: '↩',
                                            },
                                        ],
                                        data: { hProperties: { 'aria-label': 'Back to content' } },
                                    },
                                ],
                            };
                        }),
                    },
                ],
            };

            tree.children.push(noteSection);
        }
    }
};

export default remarkNote;