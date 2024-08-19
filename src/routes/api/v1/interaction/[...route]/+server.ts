import { loadNativeInteractions, loadNativeInteraction, saveNativeInteraction, createNativeInteractionReply } from "$lib/interaction/handle-native";
import { loadWebmentions } from "$lib/interaction/handle-webmention";
import { loadPost } from "$lib/post/handle-posts";
import { getRealClientAddress, getRequestPayload } from "$lib/server/event-utils";
import { sendNewReplyMail } from "$lib/server/mail";
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { NativeInteraction, NativeReply, Reply, WebmentionReply } from "$lib/interaction/types";

export const GET: RequestHandler = async ({ params, locals }) => {


    const { site } = locals as any;
    const { route } = params;

    const nativeInteractions = loadNativeInteractions(site, { route: route });

    const webmentions = loadWebmentions(site, route);

    const replies = [
        ...nativeInteractions.filter((comment: any) => comment.type === "reply") as NativeReply[],
        ...webmentions.filter((mention: any) => mention.type === "reply") as WebmentionReply[]
    ].map((reply: Reply) => {
        let newReply = JSON.parse(JSON.stringify(reply)) as Reply;
        if (newReply.author?.email?.value) {
            const email = newReply.author.email;
            delete email.value;
        }
        delete (newReply as NativeReply).ip;
        return newReply;
    });

    const mentions = [...nativeInteractions.filter((comment: any) => comment.type === "mention"), ...webmentions.filter((mention: any) => mention.type === "mention")]

    return json({ replies, mentions }, { status: 200 });
}

export const POST: RequestHandler = async ({ params, locals, request, getClientAddress }) => {
    const { site } = locals as any;
    const { route } = params;

    let payload: any = await getRequestPayload(request);

    const { type, email, name, website, text, lang, target } = payload;

    if (!text || text.trim() === '') {
        error(400, { message: "Text is required" });
    }

    // TODO lang fallback
    const post = await loadPost(site, { route, lang });

    let status = 400;
    let message = '';

    do {
        if (!post) {
            message = "Post not found";
            status = 404;
            break;
        }
        if (!post.comment?.enable) {
            message = "Comment is disabled";
            status = 403;
            break;
        }

        if (email && !email.toLowerCase().match(/[\w](([\w+-_.]+)?[\w])?@([\w](([\w-]+)?[\w])?\.)[a-z]{2,}/)) {
            message = "Invalid email";
            status = 400;
            break;
        }

        const interaction = {
            type,
            author: name,
            slug: route,
            lang,
            email,
            url: website,
            text,
            ip: getRealClientAddress({ request, getClientAddress }),
            target
        };

        let saved = saveNativeInteraction(site, { route: route }, createNativeInteractionReply(site, interaction));

        console.log('new comment saved', saved?.id);

        if (saved) {
            sendNewReplyMail(site, post, saved);

            let newInteraction = loadNativeInteraction(site, { route: route, id: saved.id });
            if (newInteraction) {
                newInteraction = JSON.parse(JSON.stringify(newInteraction)) as NativeInteraction;
                if (newInteraction) {
                    if (newInteraction.author?.email?.value) {
                        const email = newInteraction.author.email;
                        delete email.value;
                    }
                    delete (newInteraction as any).ip;
                }
            }
            return json(newInteraction, { status: 201 });
        }
    } while (false);

    error(status, { message });
}