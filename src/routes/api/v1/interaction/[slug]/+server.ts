import { loadNativeInteractions, loadNativeInteraction, saveNativeInteration } from "$lib/interaction/handle-native";
import { loadWebmentions } from "$lib/interaction/handle-webmention";
import { loadPost } from "$lib/post/handle-posts";
import { getRealClientAddress } from "$lib/server/event-utils";
import { sendNewCommentMail, sendNewReplyMail } from "$lib/server/mail";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
    const { site } = locals as any;
    const { slug } = params;

    const nativeInteractions = loadNativeInteractions(site, { slug });

    const webmentions = loadWebmentions(site, slug);

    const replies = [...nativeInteractions.filter((comment: any) => comment.type === "reply"), ...webmentions.filter((mention: any) => mention.type === "reply")];

    replies.forEach((reply: any) => {
        if (reply.author?.email?.value) {
            const email = reply.author.email;
            delete email.value;
        }
        delete reply.ip;
    });

    const mentions = [...nativeInteractions.filter((comment: any) => comment.type === "mention"), ...webmentions.filter((mention: any) => mention.type === "mention")]

    let body = JSON.stringify({ replies, mentions });

    return new Response(body, { status: 200 });
}

export const POST: RequestHandler = async ({ params, locals, request, getClientAddress }) => {
    const { site } = locals as any;
    const { slug } = params;

    let json: any = await (async () => {
        let json = {};
        if (request.headers.get("content-type")?.includes("multipart/form-data")) {
            // formData  to json
            json = Object.fromEntries([...(await request.formData()).entries()]);

        } else if (request.headers.get("content-type")?.includes("application/json")) {
            json = await request.json();
        }
        return json;
    })();

    const { type, email, name, website, text, locale, reply } = json;

    const post = await loadPost(site, { route: slug, lang: locale });

    let status = 400;
    let error = null;

    do {
        if (!post) {
            error = "Post not found";
            status = 404;
            break;
        }
        if (!post.comment?.enable) {
            error = "Comment is disabled";
            status = 403;
            break;
        }

        if (email && !email.toLowerCase().match(/[\w](([\w+-_.]+)?[\w])?@([\w](([\w-]+)?[\w])?\.)[a-z]{2,}/)) {
            error = "Invalid email";
            status = 400;
            break;
        }

        const interaction = {
            type,
            author: name,
            slug,
            lang: locale,
            email,
            url: website,
            text,
            ip: getRealClientAddress({ request, getClientAddress }),
            reply
        };

        let saved = saveNativeInteration(site, interaction as any);

        if (saved) {

            sendNewCommentMail(site, post, saved);

            if (interaction.reply) {
                let replied = loadNativeInteraction(site, { slug, id: interaction.reply });

                if (replied) {
                    sendNewReplyMail(site, post, saved, replied);
                }
            }

            let newInteraction = loadNativeInteraction(site, { slug, id: saved.id });

            if (newInteraction.author?.email?.value) {
                const email = newInteraction.author.email;
                delete newInteraction.value;
            }
            delete newInteraction.ip;

            return new Response(JSON.stringify(newInteraction), { status: 201 });
        }
    } while (false);

    return new Response(JSON.stringify({ error }), { status });
}