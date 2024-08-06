import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, locals, request, getClientAddress }) => {
    const { site } = locals as any;

    const json = await request.json();

    console.log('[interaction/postal] POST', json);

    return new Response(null, { status: 200 });
}