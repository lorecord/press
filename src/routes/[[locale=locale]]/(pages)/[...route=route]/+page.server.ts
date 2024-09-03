import { createNativeInteractionReply, saveNativeInteraction } from "$lib/interaction/handle-native";
import { decrypt } from "$lib/interaction/utils.js";
import { getPostRaw } from "$lib/post/handle-posts";
import { getSiteAccount } from "$lib/server/accounts.js";
import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import { getRealClientAddress } from "$lib/server/event-utils";
import { sendNewReplyMail } from "$lib/server/mail";
import { rateLimiter } from "$lib/server/secure";
import type { Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
    const { localeContext, site } = locals as any;

    const systemConfig = getSystemConfig(site);
    const siteConfig = getSiteConfig(site, localeContext?.uiLocale);

    return {
        localeContext,
        systemConfig,
        siteConfig
    };
}

export const actions: Actions = {
    default: async ({ request, getClientAddress, params, locals }) => {
        const { site, session, localeContext } = locals as any;
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
            rateLimiter.inflood(getRealClientAddress({ request, getClientAddress }), (limit) => limit * 0.1);
            return;
        }
        if (route?.endsWith('/')) {
            route = route.substring(0, route.length - 1);
        }

        const form = await request.formData();
        if ((form.get("captcha")?.toString().length || 0) > 0) {
            // honey pot
            console.log(`Honey pot triggered on ${route} from ${getRealClientAddress({ request, getClientAddress })}`);
            rateLimiter.inflood(getRealClientAddress({ request, getClientAddress }), (limit) => limit * 10);
            return;
        }

        const post = getPostRaw(site, locale, route);
        if (post && post.comment?.enabled && post.comment?.reply) {
            if (form.get("captcha")?.toString().length == 0
                && (form.get("name")?.toString()?.length || 0) > 0
                && form.get("email")?.toString().toLowerCase().match(/[\w](([\w+-_.]+)?[\w])?@([\w](([\w-]+)?[\w])?\.)[a-z]{2,}/)
                && (form.get("text")?.toString()?.length || 0) > 0
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
                    authorLang: localeContext?.uiLocale
                };

                let nativeReply = createNativeInteractionReply(site, comment);

                if (nativeReply.spam) {
                    const { score } = nativeReply.spam;
                    if (score && !rateLimiter.inflood(getRealClientAddress({ request, getClientAddress }), (limit) => limit * score / 10)) {
                        console.warn(`Super Spam detected on ${route} from ${getRealClientAddress({ request, getClientAddress })}`);
                        return;
                    }
                }

                let saved = saveNativeInteraction(site, { route: route.toString() }, nativeReply);

                if (saved) {
                    sendNewReplyMail(site, post, saved);
                }
            }
        } else {
            rateLimiter.inflood(getRealClientAddress({ request, getClientAddress }), (limit) => limit * 0.5);
        }
    }
};
