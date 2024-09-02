import { convertToPostForFeed, renderFeed } from "$lib/post/handle-feed";
import { getSiteAccount } from "$lib/server/accounts.js";
import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import { getPublicPostRaws } from "$lib/server/posts";
import { locale } from "$lib/translations";

export const trailingSlash = 'always';

export async function GET({ request, locals, params, url }) {
    const { site } = locals as any;
    const systemConfig = getSystemConfig(site);

    const { locale: localParam } = params;

    let lang = localParam || locale.get() || systemConfig.locale?.default || 'en';

    const siteConfig = getSiteConfig(site, lang);

    const accept = request.headers.get('accept');

    let postRaws = getPublicPostRaws(site);

    let posts = postRaws.map((p) => convertToPostForFeed(site, p))
        .filter((p) => p.template == 'item')
        .filter((p) => p.visible)
        .filter((p) => p.lang === lang);

    posts = posts?.slice(0, 20);

    const defaultAuthor = systemConfig.user?.default ? getSiteAccount(site, systemConfig.user?.default, lang) : undefined;

    let supportedLocales = Array.from(
        new Set([
            systemConfig.locale?.default || "en",
            ...(systemConfig.locale?.supports || []),
        ]),
    );

    const { body, headers } = renderFeed(accept, url, posts, lang, siteConfig, defaultAuthor, supportedLocales, systemConfig.websub);

    if (systemConfig.websub?.enabled) {
        headers['Link'] = `<${siteConfig.url}${url.pathname}>; rel="self", ` + [systemConfig.websub.endpoint || 'https://pubsubhubbub.appspot.com'].flat().filter(u => !!u).map(u => `<${u}>; rel="hub"`).join(' ');
    }

    return new Response(body, {
        status: 200,
        headers
    });
}