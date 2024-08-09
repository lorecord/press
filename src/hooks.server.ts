import fs from 'fs';
import { fetchRaw } from "$lib/post/handle-posts";
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';
import { locale, locales, loadTranslations, knownLocales } from "$lib/translations";
import { getAcceptLanguages, getPreferredLangFromHeader } from '$lib/translations/utils';
import { matchSite } from '$lib/server/sites';
import { sequence } from '@sveltejs/kit/hooks';
import { json, type Handle, type HandleServerError } from '@sveltejs/kit';
import { getEnvConfig } from '$lib/server/config';
import { getSession } from '$lib/server/session';
import { match as matchLocale } from './params/locale';
import { dev } from '$app/environment';
import { RateLimiter } from '$lib/server/rate-limit';
import { getRealClientAddress } from '$lib/server/event-utils';
import { error } from '@sveltejs/kit';

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});

const apiRateLimiter = new RateLimiter({
    limit: 1000,
    duration: 60 * 1000
});

export const handleSite: Handle = async ({ event, resolve }) => {
    const site = matchSite(event.url.hostname);
    (event.locals as any).site = site;
    return await resolve(event);
}

export const handleApiRateLimit: Handle = async ({ event, resolve }) => {
    const {site} = event.locals as any;

    if(!event.isSubRequest){
        const envConfig = getEnvConfig(site);

        let volume = 1;
        if(event.url.pathname.startsWith('/api/')) {
            volume = 10;

            if(event.request.method === 'POST') {
                volume = 100;
            }
        }else if(event.url.pathname.match(/^\/(sitemap\.|).*/)){
            volume = 50;
        }

        const ip = getRealClientAddress(event);
        if (!envConfig.private.IP_LIMIT_WHITE_LIST?.includes(ip) &&  !apiRateLimiter.inflood(ip, volume)) {
            console.log('Rate limit exceeded, last: ', apiRateLimiter.get(ip).last);
            error(429, 'Rate limit exceeded');
        }
    }    

    return await resolve(event);
}

export const handleLanguage: Handle = async ({ event, resolve }) => {
    const { site } = event.locals as any;
    const { system } = site;

    let pathLocale;
    let pathLocaleParam: string | undefined = undefined;

    let cookieLocale = event.cookies.get('locale');

    if (dev) {
        console.log('event.url', event.url.toString());
    }

    let acceptLanguageHeader = event.request.headers.get('accept-language');
    let preferedLanguage = acceptLanguageHeader ? getPreferredLangFromHeader(acceptLanguageHeader, locales.get(), system.locale?.default || 'en') : system.locale?.default || 'en';

    if (!event.url.pathname.startsWith('/api/')
        && event.url.pathname !== '/') {

        let segments = event.url.pathname.split('/');

        if (dev) {
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

        const effectedPathname = localeContext?.pathLocaleParam ? event.url.pathname.replace(`^/${localeContext?.pathLocaleParam}`, '') : event.url.pathname;

        let segments = effectedPathname.split('/');
        let fileName = segments.pop();
        let filePath = '';
        let postExsits = false;

        while (segments.length) {
            let path = segments.join('/').replace(/^\//, '');
            let lang = localeContext?.contentLocale;
            let raw = await fetchRaw(`${lang}-${path}`);

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

export const handleError: HandleServerError = async ({ error, event }) => {
    console.error(error);
}

export const handle = sequence(handleSite, handleIndexNowKeyFile, handleCookieSession, handleLanguage, handleApiRateLimit, handleHtmlLangAttr, handleAssets);