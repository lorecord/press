import { dev } from "$app/environment";
import { createNativeInteractionReply, getNativeInteraction, loadNativeInteraction, saveNativeInteraction } from "$lib/interaction/handle-native";
import type { Reply } from "$lib/interaction/types";
import { getPostRaw } from "$lib/post/handle-posts";
import { getSystemConfig } from "$lib/server/config";
import { sendNewReplyMail } from "$lib/server/mail";
import { error, json } from "@sveltejs/kit";
import Crypto from 'crypto';
import type { RequestHandler } from "./$types";
import { untag } from "$lib/utils/xml";

export const POST: RequestHandler = async ({ url, locals, request }) => {
    const { site } = locals as any;
    const systemConfig = getSystemConfig(site);

    const secretParam = url.searchParams.get('secret');

    const payload = await request.json();

    if (!dev || secretParam !== 'letmein') {
        const secret = systemConfig.postal?.secret;
        if (typeof secret === 'string') {
            if (secret !== secretParam) {
                error(401);
            }
        } else if (secret.hash?.md5
            && secret.hash?.md5?.toLowerCase() !== Crypto.createHash('md5').update(`${secretParam}${secret.hash.salt || ''}`).digest('hex').toLowerCase()) {
            error(401);
        } else if (secret.hash?.sha256
            && secret.hash?.sha256?.toLowerCase() !== Crypto.createHash('sha256').update(`${secretParam}${secret.hash.salt || ''}`).digest('hex').toLowerCase()) {
            error(401);
        }
    }

    if (payload.auto_submitted == 'auto-reply') {
        return json({ message: "Auto Reply Igored" });
    }

    const body = payload.plain_body || untag(payload.html_body || '') || payload.text_body;

    if (!body || body.trim() === '') {
        return json({ message: "Empty Message Igored" });
    }

    console.log('[postal/interact] POST', payload);

    let [, replyPart, signaturePart] = (payload.plain_body || payload.text_body).match(/([\s\S]*?)(?:\n.*[:：](?=\n)(?:\n> .*(?=\n))*)(?:\n[-—]+\s*(?=\n)(?![\s\S]*\n[-—]+\s*\n[\s\S]*)\n([\s\S]*))?/) || [];

    if (!replyPart) {
        [, replyPart, signaturePart] = payload.html_body.match(/<body[^>]*>([\s\S]*?)(?:<div[^>]*>.*[:：](?=<br>)(?:<br> .*(?=<br>))*(?:<br>[-—]+(?=<br>)(?![\s\S]*<br>[-—]+<br>[\s\S]*)<br>([\s\S]*))?)?<\/body>/) || [];
    }

    if (!replyPart) {
        return json({ message: "Signature Only Igored" });
    }

    if (systemConfig.postal?.enabled !== true) {
        console.log('Postal disabled');
        error(404);
    }



    // https://docs.postalserver.io/developer/http-payloads

    // parse 'Jim Green <test@example.com>' to '['Jim Green', 'test@example.com']', and test@example.com to ['', 'test@example.com']
    const [, author, email = payload.from] = payload.from.match(/(.*?)\s*<(.*)>/) || [];
    const [, messageUnique] = payload.message_id.match(/<?(.*)@.*>?/) || [];
    const [, target] = payload.in_reply_to?.match(/<?(.*)@.*>?/) || payload.subject?.match(/.*\(.*#(.*)\)/) || [];

    const route: string | undefined = (() => {
        if (target) {
            const { route } = getNativeInteraction(site, target) || {};
            return route;
        } else {
            if (payload.subject) {
                const [, route] = payload.subject.match(/.*\((.*)(?:#.*)?\)\s*$/) || [];
                return route;
            }
        }
    })();

    if (!route) {
        error(400, 'Invalid Post');
    }

    let replyContext: {
        is?: boolean,
        replied?: Reply
    } = {};

    let replied = loadNativeInteraction(site, { route, id: target });
    if (replied && replied.type === 'reply') {
        replyContext.is = true;
        replyContext.replied = replied;
    }

    const [, lang = replied?.lang || systemConfig.locale?.default || 'en'] = payload.subject?.match(/\[([^[]*)\]$/) || [];

    const post = getPostRaw(site, lang, route);

    if (!post) {
        error(404, 'Post not found');
    }
    if (!post.comment?.enabled || !post.comment?.reply) {
        error(403, "Comment is disabled");
    }

    // solve the website from the mail signature
    let [, website] = signaturePart?.match(/(https?:\/\/[^\s>"']+)>?/) || [];

    // TODO text or html

    const interaction = {
        channel: 'email',
        author,
        route,
        lang,
        email,
        text: replyPart.trim(),
        target,
        id: messageUnique,
        url: website,
        verified: true,
        authorLang: lang
    };

    let nativeInteraction = createNativeInteractionReply(site, interaction);

    // check spam_status
    if (payload.spam_status?.toLowerCase() === 'spam') {
        // TODO read spam score from payload
        nativeInteraction.spam = nativeInteraction.spam || { score: 8, marked: true };
    }

    let saved = saveNativeInteraction(site, { route }, nativeInteraction);

    if (saved) {
        sendNewReplyMail(site, post, saved);
    }

    return json({ message: "OK" }, { status: 200 });
}