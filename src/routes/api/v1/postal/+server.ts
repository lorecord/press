import { getSystemConfig } from "$lib/server/config";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import Crypto from 'crypto';
import { getNativeInteraction, loadNativeInteraction, saveNativeInteration } from "$lib/interaction/handle-native";
import { sendNewCommentMail, sendNewReplyMail } from "$lib/server/mail";
import { loadPost } from "$lib/post/handle-posts";
import { dev } from "$app/environment";

export const POST: RequestHandler = async ({ url, locals, request }) => {
    const { site } = locals as any;
    const systemConfig = getSystemConfig(site);

    const secretParam = url.searchParams.get('secret');

    const payload = await request.json();

    if (payload.auto_submitted == 'auto-reply') {
        return json(null);
    }

    if (!payload.plain_body) {
        return json(null);
    }

    console.log('[interaction/postal] POST', payload);

    if (systemConfig.postal?.enabled !== true) {
        console.log('Postal disabled');
        error(404);
    }

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

    // https://docs.postalserver.io/developer/http-payloads

    // parse 'Jim Green <test@example.com>' to '['Jim Green', 'test@example.com']', and test@example.com to ['', 'test@example.com']

    const [, author, email = payload.from] = payload.from.match(/(.*?)\s*<(.*)>/) || [];
    const [, mesasgeUnique] = payload.message_id.match(/<?(.*)@.*>?/) || [];
    const [, reply] = payload.in_reply_to?.match(/<?(.*)@.*>?/) || payload.subject?.match(/.*\(.*#(.*)\)/) || [];

    const slug = (() => {
        if (reply) {
            const { slug } = getNativeInteraction(site, reply);
            return slug;
        } else {
            if (payload.subject) {
                const [, slug] = payload.subject.match(/.*\((.*)\)\s*$/) || [];
                return slug;
            }
        }
    })();

    if (!slug) {
        error(400, 'Invalid Post');
    }

    let replied = loadNativeInteraction(site, { slug, id: reply });

    let lang = replied?.lang || systemConfig.locale?.default || 'en';

    const post = await loadPost(site, { route: slug, lang });

    if (!post) {
        error(404, 'Post not found');
    }
    if (!post.comment?.enable) {
        error(403, "Comment is disabled");
    }

    // solve the website from the mail signature
    let [, website] = payload.replies_from_plain_body.match(/(https?:\/\/[^\s>"']+)>?/) || [];

    // TODO text or html

    // TODO check attachments

    const interaction = {
        channel: 'email',
        author,
        slug,
        lang,
        email,
        text: payload.plain_body,
        reply,
        id: mesasgeUnique,
        url: website,
        verified: true
    };

    let saved = saveNativeInteration(site, interaction as any);

    if (saved) {
        if (interaction.reply && replied) {
            sendNewReplyMail(site, post, saved, replied);
        } else {
            sendNewCommentMail(site, post, saved);
        }
    }

    return json(null, { status: 200 });
}