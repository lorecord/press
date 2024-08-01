import fs from 'fs';
import { fetchRaw, fetchPostPath } from "$lib/post/handle-posts";
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';
import { locale, locales, loadTranslations, knownLocales } from "$lib/translations";
import { getPreferredLangFromHeader } from '$lib/translations/utils';
import { fetchPath } from '$lib/handle-path';
import { matchSite } from '$lib/server/sites';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { getEnvConfig } from '$lib/server/config';
import { getSession } from '$lib/server/session';
import { match as matchLocale } from './params/locale';

export const handleSite: Handle = async ({ event, resolve }) => {
    const site = matchSite(event.url.hostname);
    (event.locals as any).site = site;
    return await resolve(event);
}

export const handleLanguage: Handle = async ({ event, resolve }) => {
    const { site } = event.locals as any;
    const { system } = site;

    let pathLocale;
    let pathLocaleParam;

    let cookieLocale = event.cookies.get('locale');

    if (!event.url.pathname.startsWith('/api')
        && event.url.pathname !== '/') {

        let segments = event.url.pathname.split('/');
        if (segments?.length > 1 && matchLocale(segments[1])) {

            let pathLocaleParam = segments[1];

            let matchedLocale = locales.get().find(locale => locale.split('-')[0] === pathLocaleParam?.split('-')[0]);

            if (pathLocaleParam !== matchedLocale) {
                console.log(`path lang param ${pathLocaleParam} matched locale ${matchedLocale}`);
            }
        }
    }

    let acceptLanguageHeader = event.request.headers.get('accept-language');
    let preferedLanguage = acceptLanguageHeader ? getPreferredLangFromHeader(acceptLanguageHeader, locales.get(), system.locale?.default || 'en') : system.locale?.default || 'en';

    const localeData = {
        pathLocale,
        pathLocaleParam,
        cookieLocale,
        uiLocale: cookieLocale || pathLocale || preferedLanguage,
        contentLocale: pathLocale || cookieLocale || preferedLanguage
    };

    (event.locals as any).localeData = localeData;

    await loadTranslations(localeData.uiLocale);

    locale.set(localeData.uiLocale);

    return await resolve(event);
}

export const handleCommon: Handle = async ({ event, resolve }) => {
    const { site, localeData } = event.locals as any;
    const { system } = site;
    const { PUBLIC_DIR } = site.constants;

    if (!event.url.pathname.startsWith('/api')
        && event.url.pathname !== '/') {
        const effectedPathname = localeData.pathLocaleParam ? event.url.pathname.replace(`^/${localeData.pathLocaleParam}`, '') : event.url.pathname;

        let { target: targetPostMeta } = fetchPostPath(site, {
            route: effectedPathname,
            lang: localeData.contentLocale,
        });

        if (targetPostMeta) {
            if (!event.url.pathname.endsWith('/')) {
                // add slash to end
                return new Response(undefined,
                    {
                        status: 308,
                        headers: {
                            'x-sveltekit-normalize': '1',
                            Location: (event.url.pathname.startsWith('//') ? event.url.origin + event.url.pathname + '/' : event.url.pathname + '/') +
                                (event.url.search === '?' ? '' : event.url.search)
                        }
                    });
            }
        } else {
            let segments = effectedPathname.split('/');
            let fileName = segments.pop();
            let filePath = '';
            let postExsits = false;

            let { target: targetMeta } = fetchPath(site, {
                route: event.url.pathname, lang: localeData.contentLocale, match: (file) => {
                    return false;
                }
            });

            console.log(`segments`, segments);

            while (segments.length) {
                let path = segments.join('/').replace(/^\//, '');
                let lang = targetPostMeta?.lang || locale.get() || system.locale?.default;
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

            console.log('[hooks.server.ts] filePath', filePath);

            if (postExsits && fs.existsSync(filePath)) {
                let stat = fs.statSync(filePath);
                if (!stat.isDirectory()) {
                    finalFilePath = filePath;
                }
            }

            if (!finalFilePath) {
                if (fs.existsSync(PUBLIC_DIR + event.url.pathname)) {
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
    }
    return await resolve(event);
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

export const handle = sequence(handleSite, handleIndexNowKeyFile, handleCookieSession, handleLanguage, handleCommon, handleHtmlLangAttr);