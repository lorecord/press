import { normalizeUri } from 'micromark-util-sanitize-uri'

export const createFootnoteReference = (options: any = {}) => {
    const { noteLabelPrefixText = '#', defaultLabelPrefixText = '' } = options;
    const counterLabelPrefixMap: any = {
        note: noteLabelPrefixText,
        default: defaultLabelPrefixText
    }

    return (state, node) => {
        const clobberPrefix =
            typeof state.clobberPrefix === 'string'
                ? state.clobberPrefix
                : 'user-content-'
        const id = String(node.identifier).toUpperCase()

        const identifier = node.identifier as string;
        let newIdentifier = identifier;

        if (identifier.startsWith('note:')) {
            node.footnoteGroup = `note`;
        } else {
            node.footnoteGroup = `default`;
        }

        const safeId = normalizeUri(id.toLowerCase())

        let footnoteOrder = (state.footnoteOrderStat || (state.footnoteOrderStat = {}))[node.footnoteGroup] || (state.footnoteOrderStat[node.footnoteGroup] = []);

        let footnoteCounts = (state.footnoteCountsStat || (state.footnoteCountsStat = {}))[node.footnoteGroup] || (state.footnoteCountsStat[node.footnoteGroup] = {});

        const index = footnoteOrder.indexOf(id)
        /** @type {number} */
        let counter;

        let reuseCounter = footnoteCounts[id]

        if (reuseCounter === undefined) {
            reuseCounter = 0
            footnoteOrder.push(id)
            counter = footnoteOrder.length
        } else {
            counter = index + 1
        }

        reuseCounter += 1
        footnoteCounts[id] = reuseCounter;

        /** @type {Element} */
        const link = {
            type: 'element',
            tagName: 'a',
            properties: {
                href: '#' + clobberPrefix + 'fn-' + safeId,
                id:
                    clobberPrefix +
                    'fnref-' +
                    safeId +
                    (reuseCounter > 1 ? '-' + reuseCounter : ''),
                dataFootnoteRef: true,
                ariaDescribedBy: ['footnote-label']
            },
            children: [{
                type: 'text', value: `${state.footnoteRefPrefixSupplier ?
                    state.footnoteRefPrefixSupplier(node.footnoteGroup) : (node.footnoteGroup ? counterLabelPrefixMap[node.footnoteGroup] : '')}${counter}`
            }]
        }
        state.patch(node, link)

        /** @type {Element} */
        const sup = {
            type: 'element',
            tagName: 'sup',
            properties: {},
            children: [link]
        }
        state.patch(node, sup)
        return state.applyData(node, sup)
    }
}

export const footnoteReference = createFootnoteReference();