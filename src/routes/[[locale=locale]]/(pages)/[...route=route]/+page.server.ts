import { getSystemConfig } from "$lib/server/config";
import { saveNativeInteraction, createNativeInteractionReply } from "$lib/interaction/handle-native";
import { loadPost } from "$lib/post/handle-posts";
import { getRealClientAddress } from "$lib/server/event-utils";
import { sendNewReplyMail } from "$lib/server/mail";
import { getSiteAccount } from "$lib/server/accounts.js";
import { decrypt } from "$lib/interaction/utils.js";
import type { Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
    const { localeContext, site } = locals as any;

    const systemConfig = getSystemConfig(site);

    return {
        localeContext,
        systemConfig
    };
}

export const actions: Actions = {
    default: async ({ request, getClientAddress, params, locals }) => {
        const { site, session } = locals as any;
        const systemConfig = getSystemConfig(site);

        let username = '';
        let email = '';
        if (session) {
            let account = getSiteAccount(site, session.username, '');
            if (account?.email?.value) {
                email = decrypt(site, account.email.value);
            }
            username = session.username;
        }

        let { route, locale } = params;
        if (!route) {
            return;
        }
        if (route?.endsWith('/')) {
            route = route.substring(0, route.length - 1);
        }

        const post = await loadPost(site, { route, lang: locale || undefined });
        if (post && post.comment?.enabled) {
            const form = await request.formData();
            if (form.get("captcha")?.toString().length == 0 // honey pot
                && form.get("name")?.toString()?.length || 0 > 0
                && form.get("email")?.toString().toLowerCase().match(/[\w](([\w+-_.]+)?[\w])?@([\w](([\w-]+)?[\w])?\.)[a-z]{2,}/)
                && form.get("text")?.toString()?.length || 0 > 0
                && (form.get("website")?.toString()?.length == 0
                    || form.get("email")?.toString().match(/^(http)/))) {

                let comment = {
                    lang: form.get("lang")?.toString() || locale || systemConfig.locale.default || 'en',
                    author: form.get("name")?.toString() || '',
                    user: email === form.get("email")?.toString() ? username : '',
                    email: form.get("email")?.toString() || '',
                    url: form.get("website")?.toString() || '',
                    text: form.get("text")?.toString() || '',
                    ip: getRealClientAddress({ request, getClientAddress }),
                    target: form.get("target")?.toString() || '',
                };
                let saved = saveNativeInteraction(site, { route: route.toString() }, createNativeInteractionReply(site, comment));

                if (saved) {
                    sendNewReplyMail(site, post, saved);
                }
            }
        }
    }
};
