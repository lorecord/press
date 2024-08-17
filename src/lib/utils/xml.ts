export function untag(xml: string) {
    return xml.replaceAll(/<.*?>/g, '');
}