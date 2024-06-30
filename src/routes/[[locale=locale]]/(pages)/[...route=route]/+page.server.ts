import { getSystemConfig } from "$lib/server/config";
import { saveNativeInteration, loadNativeInteration } from "$lib/interaction/handle-native";
import { loadPost } from "$lib/post/handle-posts";
import { getRealClientAddress } from "$lib/server/event-utils";
import { sendNewCommentMail, sendNewReplyMail } from "$lib/server/mail";
import { getSession } from "$lib/server/session.js";
import { getSiteAccount } from "$lib/server/accouns.js";
import { decrypt } from "$lib/interaction/utils.js";

/** @type {import('./$types').Actions} */
export const actions = {
    default: async ({ request, setHeaders, getClientAddress, params, locals, cookies }) => {
        const { site, session } = locals;
        const systemConfig = getSystemConfig(site);

        let username = '';
        let email = '';
        if (session) {
            let account = getSiteAccount(site, session.username, '');
            if (account) {
                email = decrypt(site, account.email.value);
            }
            username = session.username;
        }

        let { route, locale } = params;
        if (route.endsWith('/')) {
            route = route.substring(0, route.length - 1);
        }
        const post = await loadPost(site, { route, lang: locale || undefined });
        if (post && post.comment?.enable) {
            const form = await request.formData();
            if (form.get("captcha")?.toString().length == 0 // honey pot
                && form.get("name")?.toString()?.length || 0 > 0
                && form.get("email")?.toString().toLowerCase().match(/[\w](([\w+-_.]+)?[\w])?@([\w](([\w-]+)?[\w])?\.)[a-z]{2,}/)
                && form.get("text")?.toString()?.length || 0 > 0
                && (form.get("website")?.toString()?.length == 0
                    || form.get("email")?.toString().match(/^(http)/))) {

                let comment = {
                    slug: route.toString(),
                    lang: locale || systemConfig.locale.default,
                    author: form.get("name")?.toString() || '',
                    user: email === form.get("email")?.toString() ? username : '',
                    email: form.get("email")?.toString() || '',
                    url: form.get("website")?.toString() || '',
                    text: form.get("text")?.toString() || '',
                    ip: getRealClientAddress({ request, getClientAddress }),
                    reply: form.get("reply")?.toString() || '',
                };
                let saved = saveNativeInteration(site, comment);

                sendNewCommentMail(site, post, saved);

                if (comment.reply) {
                    let replied = loadNativeInteration(site, { slug: route.toString(), id: comment.reply });
                    if (replied) {
                        sendNewReplyMail(site, post, saved, replied);
                    }
                }
            }
        }
    }
};