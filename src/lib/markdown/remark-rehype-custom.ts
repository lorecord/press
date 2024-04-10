import { createState } from 'mdast-util-to-hast/lib/state.js';
import { normalizeUri } from 'micromark-util-sanitize-uri';

const footnoteLabelMap: any = {
    default: 'Reference',
    note: 'Notes',
}

function defaultFootnoteBackContent(_, rereferenceIndex) {
    /** @type {Array<ElementContent>} */
    const result = [{ type: 'text', value: '↩' }]

    if (rereferenceIndex > 1) {
        result.push({
            type: 'element',
            tagName: 'sup',
            properties: {},
            children: [{ type: 'text', value: String(rereferenceIndex) }]
        })
    }

    return result
}

/**
 * Generate the default label that GitHub uses on backreferences.
 *
 * @param {number} referenceIndex
 *   Index of the definition in the order that they are first referenced,
 *   0-indexed.
 * @param {number} rereferenceIndex
 *   Index of calls to the same definition, 0-indexed.
 * @returns {string}
 *   Label.
 */
function defaultFootnoteBackLabel(referenceIndex, rereferenceIndex) {
    return (
        'Back to reference ' +
        (referenceIndex + 1) +
        (rereferenceIndex > 1 ? '-' + rereferenceIndex : '')
    )
}

function footer(state) {
    const clobberPrefix =
        typeof state.clobberPrefix === 'string'
            ? state.clobberPrefix
            : 'user-content-';
    const footnoteBackContent =
        state.footnoteBackContent || defaultFootnoteBackContent
    const footnoteBackLabel =
        state.footnoteBackLabel || defaultFootnoteBackLabel
    let footnoteLabel = state.footnoteLabel || 'Footnotes'
    const footnoteLabelTagName = state.footnoteLabelTagName || 'h2'
    const footnoteLabelProperties = state.footnoteLabelProperties || {
        className: ['sr-only']
    }

    let result = [];

    const footGroups = ['note', 'default'];

    state.footnoteOrderStat = state.footnoteOrderStat || {};
    state.footnoteCountsStat = state.footnoteCountsStat || {};

    for (let group of footGroups) {

        /** @type {Array<ElementContent>} */
        const listItems = []
        let referenceIndex = -1

        let footnoteOrder = state.footnoteOrderStat[group] || (state.footnoteOrderStat[group] = []);
        let footnoteCounts = state.footnoteCountsStat[group] || (state.footnoteCountsStat[group] = {});

        footnoteLabel = (state.footnoteLabelSupplier ? state.footnoteLabelSupplier(group) : footnoteLabelMap[group]) || footnoteLabel;

        let footnoteLabelId = state.footnoteLabelIdSupplier ? state.footnoteLabelIdSupplier(group) : 'footnote-label';

        while (++referenceIndex < footnoteOrder.length) {
            const def = state.footnoteById[footnoteOrder[referenceIndex]]

            if (!def) {
                continue
            }

            const content = state.all(def)
            const id = String(def.identifier).toUpperCase()
            const safeId = normalizeUri(id.toLowerCase())
            let rereferenceIndex = 0
            /** @type {Array<ElementContent>} */
            const backReferences = []
            const counts = footnoteCounts[id]

            // eslint-disable-next-line no-unmodified-loop-condition
            while (counts !== undefined && ++rereferenceIndex <= counts) {
                if (backReferences.length > 0) {
                    backReferences.push({ type: 'text', value: ' ' })
                }

                let children =
                    typeof footnoteBackContent === 'string'
                        ? footnoteBackContent
                        : footnoteBackContent(referenceIndex, rereferenceIndex)

                if (typeof children === 'string') {
                    children = { type: 'text', value: children }
                }

                backReferences.push({
                    type: 'element',
                    tagName: 'a',
                    properties: {
                        href:
                            '#' +
                            clobberPrefix +
                            'fnref-' +
                            safeId +
                            (rereferenceIndex > 1 ? '-' + rereferenceIndex : ''),
                        dataFootnoteBackref: '',
                        ariaLabel:
                            typeof footnoteBackLabel === 'string'
                                ? footnoteBackLabel
                                : footnoteBackLabel(referenceIndex, rereferenceIndex),
                        className: ['data-footnote-backref']
                    },
                    children: Array.isArray(children) ? children : [children]
                })
            }

            const tail = content[content.length - 1]

            if (tail && tail.type === 'element' && tail.tagName === 'p') {
                const tailTail = tail.children[tail.children.length - 1]
                if (tailTail && tailTail.type === 'text') {
                    tailTail.value += ' '
                } else {
                    tail.children.push({ type: 'text', value: ' ' })
                }

                tail.children.push(...backReferences)
            } else {
                content.push(...backReferences)
            }

            /** @type {Element} */
            const listItem = {
                type: 'element',
                tagName: 'li',
                properties: { id: clobberPrefix + 'fn-' + safeId },
                children: state.wrap(content, true)
            }

            state.patch(def, listItem)

            listItems.push(listItem)
        }

        if (listItems.length === 0) {
            continue;
        }
        result.push({
            type: 'element',
            tagName: 'section',
            properties: { dataFootnotes: true, className: ['footnotes'] },
            children: [
                {
                    type: 'element',
                    tagName: footnoteLabelTagName,
                    properties: {
                        ...structuredClone(footnoteLabelProperties),
                        id: footnoteLabelId
                    },
                    children: [{ type: 'text', value: footnoteLabel }]
                },
                { type: 'text', value: '\n' },
                {
                    type: 'element',
                    tagName: 'ol',
                    properties: {},
                    children: state.wrap(listItems, true)
                },
                { type: 'text', value: '\n' }
            ]
        });
    }
    if (result.length > 0) {
        result.unshift({
            tagName: 'hr',
            type: 'element',
            properties: {
                className: ['end-of-main']
            }
        });
    }
    return result;
}

function toHast(tree, options) {
    const state = createState(tree, options)

    state.footnoteLabelSupplier = options.footnoteLabelSupplier;
    state.footnoteLabelIdSupplier = options.footnoteLabelIdSupplier;
    state.footnoteRefPrefixSupplier = options.footnoteRefPrefixSupplier;

    const node = state.one(tree, null)
    const foot = footer(state)
    /** @type {HastNodes} */
    const result = Array.isArray(node)
        ? { type: 'root', children: node }
        : node || { type: 'root', children: [] }

    if (foot) {
        // If there’s a footer, there were definitions, meaning block
        // content.
        // So `result` is a parent node.
        result?.children?.push({ type: 'text', value: '\n' }, ...foot)
    }

    return result
}

export default function remarkRehype(destination, options) {
    if (destination && 'run' in destination) {
        /**
         * @type {TransformBridge}
         */
        return async function (tree, file) {
            // Cast because root in -> root out.
            const hastTree = /** @type {HastRoot} */ (toHast(tree, options))
            await destination.run(hastTree, file)
        }
    }

    /**
     * @type {TransformMutate}
     */
    return function (tree) {
        // Cast because root in -> root out.
        return /** @type {HastRoot} */ (toHast(tree, options || destination))
    }
}