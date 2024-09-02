import { dev } from '$app/environment';
import { getPostRaw } from "$lib/post/handle-posts";
import { getEnvConfig, getSystemConfig } from '$lib/server/config';
import { getRealClientAddress } from '$lib/server/event-utils';
import { rateLimiter } from '$lib/server/secure';
import { getSession } from '$lib/server/session';
import { matchSite } from '$lib/server/sites';
import { loadTranslations, locale, locales } from "$lib/translations";
import { getAcceptLanguages, getPreferredLangFromHeader } from '$lib/translations/utils';
import { error, json, text, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';
import fs from 'fs';
import { match as matchLocale } from './params/locale';
import { addRelToExternalLinks, addTargetBlankToExternalLinks } from '$lib/utils/html';

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});

export const handleExternalLink: Handle = async ({ event, resolve }) => {
    const { site } = event.locals as any;
    const systemConfig = getSystemConfig(site);
    const response = await resolve(event, {
        transformPageChunk: ({ html }) => {
            if (systemConfig.html?.auto_external_link) {
                html = addRelToExternalLinks(html, event.request.url, [systemConfig.domains.primary]);
            }
            if (systemConfig.html?.open_external_link_in_new_tab) {
                html = addTargetBlankToExternalLinks(html);
            }
            return html;
        },
    });
    return response;
}

export const handleSite: Handle = async ({ event, resolve }) => {
    const site = matchSite(event.url.hostname);
    (event.locals as any).site = site;
    return await resolve(event);
}

export const handleRequestRateLimit: Handle = async ({ event, resolve }) => {
    if (!event.isSubRequest) {
        const { site } = event.locals as any;
        if (dev) {
            console.log('[hooks.server.ts] handleRequestRateLimit', event.url.pathname);
        }
        const envConfig = getEnvConfig(site);

        let volume = 1;
        if (event.url.pathname.startsWith('/api/')) {
            volume = 5;

            if (event.request.method === 'POST') {
                volume = 100;
            }
        } else if (event.url.pathname.match(/^\/((sitemap\..*)|({[a-z]{2}(-[a-zA-Z]{2,5})?}\/feed))(\?.*)?/)) {
            volume = 25;
        }

        const ip = getRealClientAddress(event);
        if (!envConfig.private?.IP_LIMIT_WHITE_LIST?.includes(ip) && !rateLimiter.inflood(ip, volume)) {
            console.warn(`[${site.unique}] Rate limit exceeded: ${event.url.pathname} from ${ip}, last @ ${new Date(rateLimiter.get(ip).last)?.toISOString()}`);

            if (event.request.headers.get('accept')?.includes('text/html')) {
                error(429, `Rate limit exceeded`);
            } else if (event.request.headers.get('accept')?.includes('text/plain')) {
                return text(`Rate limit exceeded`, { status: 429 });
            } else if (!event.request.headers.get('accept')?.includes('application/json') && event.request.headers.get('accept') != '*/*') {
                return new Response(`Rate limit exceeded`, { status: 429 });
            } else {
                const rateLimitHeader = buildRateLimitHeader(rateLimiter.get(ip));
                return json('Rate limit exceeded', { status: 429, headers: rateLimitHeader });
            }
        }
    }

    return await resolve(event);
}

function buildRateLimitHeader(bucket: any) {
    return {
        'X-RateLimit-Limit': `${bucket.capacity}`,
        'X-RateLimit-Remaining': `${bucket.capacity - bucket.water}`,
        'X-RateLimit-Used': `${bucket.water}`,
        'X-RateLimit-Reset': `${Math.floor(bucket.getResetDuration()) + Date.now()}`,
        'Retry-After': `${new Date(Math.floor(bucket.getResetDuration()) + Date.now()).toUTCString()}`
    }
}

export const handleRequestRateLimitHeader: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);
    if (response.status == 429) {
        const { site } = event.locals as any;
        const ip = getRealClientAddress(event);
        console.warn(`[${site.unique}] Rate limit exceeded: ${event.url.pathname} from ${ip}, last @ ${new Date(rateLimiter.get(ip).last)?.toISOString()}`);
        Object.entries(buildRateLimitHeader(rateLimiter.get(ip))).forEach(([key, value]) => response.headers.set(key, value));
    }
    return response;
}

export const handleLanguage: Handle = async ({ event, resolve }) => {
    const { site } = event.locals as any;
    const { system } = site;

    let pathLocale;
    let pathLocaleParam: string | undefined = undefined;

    let cookieLocale = event.cookies.get('locale');

    let acceptLanguageHeader = event.request.headers.get('accept-language');
    let preferedLanguage = acceptLanguageHeader ? getPreferredLangFromHeader(acceptLanguageHeader, locales.get(), system.locale?.default || 'en') : system.locale?.default || 'en';

    if (!event.url.pathname.startsWith('/api/')
        && event.url.pathname !== '/') {

        let segments = event.url.pathname.split('/');

        if (dev && !event.isSubRequest && !event.isDataRequest) {
            console.log('segments[1]', segments[1]);
            console.log('matchLocale(segments[1])', matchLocale(segments[1]))
        }
        if (segments?.length > 1 && matchLocale(segments[1])) {

            pathLocaleParam = segments[1];

            let matchedLocale = locales.get().find(locale => locale.split('-')[0] === pathLocaleParam?.split('-')[0]);

            if (pathLocaleParam !== matchedLocale) {
                if (dev) {
                    console.log(`path lang param ${pathLocaleParam} matched locale ${matchedLocale}`);
                }
            }

            pathLocale = matchedLocale;
        }
    }

    if (!event.isSubRequest) {
        const localeContext = {
            pathLocale,
            pathLocaleParam,
            cookieLocale,
            preferedLanguage,
            acceptLanguages: acceptLanguageHeader ? getAcceptLanguages(acceptLanguageHeader) : [],
            uiLocale: cookieLocale || pathLocale || preferedLanguage,
            contentLocale: pathLocale || cookieLocale || preferedLanguage
        };

        (event.locals as any).localeContext = localeContext;

        if (dev) {
            console.log('localeContext', localeContext);
            console.log('loadTranslations', localeContext.uiLocale);
        }
        await loadTranslations(localeContext.uiLocale);
    }

    return await resolve(event);
}

export const handleAssets: Handle = async ({ event, resolve }) => {
    const { site, localeContext } = event.locals as any;
    const { PUBLIC_DIR } = site.constants;

    const response = await resolve(event);

    if (response.status === 404) {

        if (dev) {
            console.log('handleAssets', event.url.pathname);
        }

        const effectedPathname = localeContext?.pathLocaleParam ? event.url.pathname.replace(`^/${localeContext?.pathLocaleParam}`, '') : event.url.pathname;

        let segments = effectedPathname.split('/');
        let fileName = segments.pop();
        let filePath = '';
        let postExsits = false;

        while (segments.length) {
            let path = segments.join('/') + "/";
            let lang = localeContext?.contentLocale;
            let raw = await getPostRaw(site, lang, path);

            if (raw) {
                postExsits = true;
                let segs = raw.path.split('/');
                segs.pop();
                let folder = segs.join('/');
                filePath = folder + '/' + fileName;
                break;
            }
            segments.pop();
        }

        let finalFilePath = '';

        if (postExsits && fs.existsSync(filePath)) {
            let stat = fs.statSync(filePath);
            if (!stat.isDirectory()) {
                finalFilePath = filePath;
            } else {
                let indexFilePath = filePath + '/index.html';
                if (fs.existsSync(indexFilePath)) {
                    finalFilePath = indexFilePath;
                }
            }
        }

        if (!finalFilePath) {
            if (fs.existsSync(PUBLIC_DIR + event.url.pathname)) {
                // TODO resolve assets locale with localeContext.uiLocale
                finalFilePath = PUBLIC_DIR + event.url.pathname;
            }
        }

        if (finalFilePath) {
            // return file response
            let buffer = fs.readFileSync(finalFilePath);

            let type: any = {};
            if (finalFilePath.match(/.*\.[\w-_]+$/)) {
                type = await fileTypeFromFile(finalFilePath);
            } else {
                type = await fileTypeFromBuffer(buffer);
            }

            if (type?.mime?.match(/^(image|video|text|audio|font)\/.*/)) {
                return new Response(buffer,
                    {
                        status: 200,
                        headers: {
                            'Content-Type': type?.mime,
                        }
                    });
            } else {
                return new Response(buffer,
                    {
                        status: 200,
                        headers: {
                            'Content-Type': type?.mime || 'application/octet-stream',
                            'Content-Disposition': `attachment; filename="${fileName}"`
                        }
                    });
            }
        }
    }
    return response;
}

export const handleHtmlLangAttr: Handle = async ({ event, resolve }) => {
    return await resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%lang%', locale.get())
    });
};

export const handleCookieSession: Handle = async ({ event, resolve }) => {
    let session = null;
    const sessionId = event.cookies.get('session');

    if (sessionId) {
        session = getSession(sessionId);
    }

    (event.locals as any).session = session;

    if (event.url.pathname.startsWith('/admin')) {
        if (!session) {
            return new Response(`<script>window.location.href = '/signin?continue=${encodeURIComponent(event.url.pathname)}';</script>`, {
                status: 401,
                headers: {
                    'Content-Type': 'text/html'
                }
            });
        }
    }

    return await resolve(event);
}

export const handleIndexNowKeyFile: Handle = async ({ event, resolve }) => {
    const { site } = event.locals as any;
    const envConfig = getEnvConfig(site);
    if (envConfig.private?.INDEXNOW_KEY && event.url.pathname === `/${envConfig.private?.INDEXNOW_KEY}.txt`) {
        return new Response(envConfig.private?.INDEXNOW_KEY, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    }
    return await resolve(event);
};

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
    if (status < 500) {
        rateLimiter.inflood(getRealClientAddress(event), 10);
        console.log(`[handleError]`, status, message, event.url.href, getRealClientAddress(event));
    } else {
        console.error('[handleError]', status, message, event.url.href, getRealClientAddress(event), error);
    }
}

export const handle = sequence(
    handleSite,
    handleRequestRateLimit,
    handleIndexNowKeyFile,
    handleCookieSession,
    handleLanguage,
    // after await resolve(event), the seq bellow will be executed in reverse order
    handleHtmlLangAttr,
    handleExternalLink,
    handleRequestRateLimitHeader,
    handleAssets
);