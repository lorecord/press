import { loadComments } from "$lib/handle-discuss";

export function GET({ params, locals }) {
    const { site } = locals;
    const { slug } = params;

    const comments = loadComments(site, { slug });
    let body = JSON.stringify(comments);

    return new Response(body, { status: 200 });
}
