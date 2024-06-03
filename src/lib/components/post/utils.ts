export const trancateText = (content: string | undefined, maxLength: number = 160) => {
    if (!content || content?.length < maxLength) {
        return content;
    }

    let trancated = content.slice(0, maxLength);

    if (content.length > maxLength) {
        const lastSpaceIndex = trancated.lastIndexOf(' ');
        if (lastSpaceIndex !== -1) {
            trancated = trancated.slice(0, lastSpaceIndex);
        }
        trancated += '...';
    }

    return trancated;
}