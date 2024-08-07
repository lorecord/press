import { loadNativeInteractions, loadNativeInteraction, saveNativeInteration } from "$lib/interaction/handle-native";
import { loadWebmentions } from "$lib/interaction/handle-webmention";
import { loadPost } from "$lib/post/handle-posts";
import { getRealClientAddress } from "$lib/server/event-utils";
import { sendNewCommentMail, sendNewReplyMail } from "$lib/server/mail";
import { json, error } from "@sveltejs/kit";
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

    return json(body, { status: 200 });
}

export const POST: RequestHandler = async ({ params, locals, request, getClientAddress }) => {
    const { site } = locals as any;
    const { slug } = params;

    let payload: any = await (async () => {
        let payload = {};
        if (request.headers.get("content-type")?.includes("multipart/form-data")) {
            // formData  to json
            payload = Object.fromEntries([...(await request.formData()).entries()]);

        } else if (request.headers.get("content-type")?.includes("application/json")) {
            payload = await request.json();
        }
        return payload;
    })();

    const { type, email, name, website, text, lang, reply } = payload;

    // TODO lang fallback
    const post = await loadPost(site, { route: slug, lang });

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
            slug,
            lang,
            email,
            url: website,
            text,
            ip: getRealClientAddress({ request, getClientAddress }),
            reply
        };

        let saved = saveNativeInteration(site, interaction as any);

        if (saved) {
            let replyContext = {
                is: false,
                replied: {}
            };

            if (interaction.reply) {
                let replied = loadNativeInteraction(site, { slug, id: interaction.reply });

                if (replied) {
                    replyContext.is = true;
                    replyContext.replied = replied;
                }
            }

            if (replyContext.is) {
                sendNewReplyMail(site, post, saved, replyContext.replied);
            } else {
                sendNewCommentMail(site, post, saved);
            }

            let newInteraction = loadNativeInteraction(site, { slug, id: saved.id });

            if (newInteraction.author?.email?.value) {
                const email = newInteraction.author.email;
                delete newInteraction.value;
            }
            delete newInteraction.ip;

            return json(newInteraction, { status: 201 });
        }
    } while (false);

    error(status, { message });
}