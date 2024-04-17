import { loadNativeInteractions } from "$lib/interaction/handle-native";
import { loadWebmentions } from "$lib/interaction/handle-webmention";

export function GET({ params, locals }) {
    const { site } = locals;
    const { slug } = params;

    const nativeInteractions = loadNativeInteractions(site, { slug });

    const webmentions = loadWebmentions(site, slug);

    const replies = [...nativeInteractions.filter((comment: any) => comment.type === "reply"), ...webmentions.filter((mention: any) => mention.type === "reply")];

    const mentions = [...nativeInteractions.filter((comment: any) => comment.type === "mention"), ...webmentions.filter((mention: any) => mention.type === "mention")]

    let body = JSON.stringify({ replies, mentions });

    return new Response(body, { status: 200 });
}
