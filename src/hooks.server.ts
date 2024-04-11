import fs from 'fs';
import { fetchRaw, fetchPostPath } from "$lib/post/handle-posts";
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';
import { locale, locales, loadTranslations } from "$lib/translations";
import { getPreferredLangFromHeader } from '$lib/translations/utils';
import { fetchPath } from '$lib/handle-path';
import { matchSite } from '$lib/server/sites';
import { getSiteAccount } from '$lib/server/accouns';

{
    const currentLocale = locale.get();
    for (let item of locales.get()) {
        if (item === currentLocale) {
            continue;
        }
        await loadTranslations(item);
    }
    if (currentLocale) {
        await loadTranslations(currentLocale);
    } else {
        await loadTranslations('en');
    }
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const site = matchSite(event.url.hostname);

    const { PUBLIC_DIR } = site.constants;

    const { system } = site;

    event.locals.site = site;

    let pathLang: string | undefined = '';

    if (!event.url.pathname.startsWith('/api')
        && event.url.pathname !== '/') {

        console.log('event.url.pathname', event.url.pathname);
        let segments = event.url.pathname.split('/');
        if (segments?.length > 1 && /^\w{2,3}(-\w{2,6})?$/.test(segments[1])) {
            segments[0] = segments[1];
            pathLang = segments.shift();
            segments[0] = '';
        }

        let cookieLang = event.cookies.get('locale');

        event.locals.cookieLocale = cookieLang;

        let acceptLanguageHeader = event.request.headers.get('accept-language');
        let preferedLanguage = acceptLanguageHeader ? getPreferredLangFromHeader(acceptLanguageHeader, locales.get(), system.locale?.default || 'en') : system.locale?.default || 'en';

        console.debug('hook.server.ts preferedLanguage', preferedLanguage);

        let { target: targetPostMeta } = fetchPostPath(site, {
            route: segments.join('/'),
            lang: pathLang || cookieLang || locale.get() || system.locale?.default || 'en',
        });

        console.log('targetPostMeta.lang', targetPostMeta?.lang);

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
            let fileName = segments.pop();
            let filePath = '';
            let postExsits = false;


            let { target: targetMeta } = fetchPath(site, {
                route: event.url.pathname, lang: locale.get(), match: (file) => {
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
    const response = await resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%lang%', pathLang || locale.get() || system.locale?.default)
    });
    return response;
}