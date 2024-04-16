import { loadComments } from "$lib/handle-discuss";
import { loadMentions } from "$lib/interaction/handle-webmention";

export function GET({ params, locals }) {
    const { site } = locals;
    const { slug } = params;

    const comments = loadComments(site, { slug });
    const mentions = loadMentions(site, slug);
    let body = JSON.stringify({ comments, mentions });

    return new Response(body, { status: 200 });
}
