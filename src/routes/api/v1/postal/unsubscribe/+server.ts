import { getSystemConfig } from "$lib/server/config";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import Crypto from 'crypto';
import { getNativeInteraction, loadNativeInteraction } from "$lib/interaction/handle-native";
import { loadPost } from "$lib/post/handle-posts";
import { dev } from "$app/environment";
import type { Reply } from "$lib/interaction/types";

export const POST: RequestHandler = async ({ url, locals, request }) => {
    const { site } = locals as any;
    const systemConfig = getSystemConfig(site);

    const secretParam = url.searchParams.get('secret');

    const payload = await request.json();

    console.log('[postal/unsubscribe] POST', payload);

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
    const [, messageUnique] = payload.message_id.match(/<?(.*)@.*>?/) || [];
    const [, target] = payload.in_reply_to?.match(/<?(.*)@.*>?/) || payload.subject?.match(/.*\(.*#(.*)\)/) || [];

    const slug: string | undefined = (() => {
        if (target) {
            const { slug } = getNativeInteraction(site, target) || {};
            return slug;
        } else {
            if (payload.subject) {
                const [, slug] = payload.subject.match(/.*\((.*)(?:#.*)?\)\s*$/) || [];
                return slug;
            }
        }
    })();

    if (!slug) {
        error(400, 'Invalid Post');
    }

    let replyContext: {
        is?: boolean,
        replied?: Reply
    } = {};

    let replied = loadNativeInteraction(site, { slug, id: target });
    if (replied && replied.type === 'reply') {
        replyContext.is = true;
        replyContext.replied = replied;
    }

    let lang = replied?.lang || systemConfig.locale?.default || 'en';

    const post = await loadPost(site, { route: slug, lang });

    if (!post) {
        error(404, 'Post not found');
    }
    if (!post.comment?.enable) {
        error(403, "Comment is disabled");
    }

    return json({ message: "OK" }, { status: 200 });
}