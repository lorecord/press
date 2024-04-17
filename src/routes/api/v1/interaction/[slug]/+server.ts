import { loadComments } from "$lib/handle-discuss";
import { loadMentions } from "$lib/interaction/handle-webmention";

export function GET({ params, locals }) {
    const { site } = locals;
    const { slug } = params;

    const comments = loadComments(site, { slug });
    const mentions = loadMentions(site, slug);

    const replies = [...comments.filter((comment: any) => comment.type === "reply"), ...mentions.filter((mention: any) => mention.type === "reply")];

    let body = JSON.stringify({ replies });

    return new Response(body, { status: 200 });
}
