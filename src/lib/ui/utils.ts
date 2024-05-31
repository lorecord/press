export const formatToHTMLStyleFromObject = (styleObj: any) => {
    if (!styleObj) {
        return;
    }
    if (typeof styleObj === "string") {
        return styleObj;
    }
    return Object.entries(styleObj).reduce(
        (acc, [key, value]) => `${acc} ${key}: ${value};`,
        "",
    );
};