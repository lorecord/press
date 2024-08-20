import fs from 'fs';
import type { Site } from './server/sites';

export interface PathMeta {
    file: string,
    lang: string
}

export interface LangMap {
    [lang: string]: PathMeta
}

export function langFallback(langMap: LangMap, lang: string | undefined): PathMeta | undefined {
    lang = lang || '';
    if (lang) {
        if (langMap[lang]) {
            return langMap[lang];
        }

        // zh-hant or zh_hant
        if (/\w+[-_]\w+/.test(lang)) {
            // zh-hant -> zh
            let main = lang.split(/[-_]/)[0];
            if (langMap[main]) {
                return langMap[main];
            }
            for (let langKey in langMap) {
                // if langKey is zh-hans or zh, lang is zh-hant
                if (langKey.startsWith(`${main}-`) || langKey === main) {
                    return langMap[langKey];
                }
            }
        }
    }
    let defaultLang = lang;
    if (langMap[defaultLang]) {
        return langMap[defaultLang];
    }
    if (langMap['']) {
        return langMap[''];
    }
    return Object.values(langMap)[0];
}

export function findPath({ segments, dir, match }: { segments: string[], dir: string, match: (file: string) => boolean }): string[] {
    let results = [];
    let files = fs.readdirSync(dir);
    for (let file of files) {
        let slug = file.replace(/^\d+\./, '');
        let filePath = `${dir}/${file}`;
        let stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file.match(/^\(.*\)$/)) { // skip `(dir)`
                let subResults = findPath({ segments, dir: filePath, match });
                results.push(...subResults);
            } else if (slug === segments[0]) { // segments: ['a','b'] and dir is 'a'
                let subResults = findPath({ segments: segments.slice(1), dir: filePath, match });
                results.push(...subResults);
            }
        } else {
            if (segments.length == 0 && match(file)) {
                results.push(filePath);
            }
        }
    }
    return results;
}

export function fetchPath(site: Site, { route, lang, match }: { route: string, lang?: string, match: (file: string) => boolean }): { target: PathMeta | undefined, langMap: LangMap | undefined } {
    const { POSTS_DIR } = site.constants;
    if (route) {
        if (!route.replace) {
            console.error('route', route);
        }
        // route: `/a/b/c/` to ['a','b','c']
        let segments = route.replace(/(^\/)|(\/$)/, '').split('/');
        let results = findPath({
            segments, dir: POSTS_DIR, match
        });
        if (results?.length) {
            let langMap: LangMap = {};

            results.forEach(r => {
                // r: xx.en.md
                let matcher = r.match(/^.*?\.(?:([^.]+)\.)?md$/);
                if (matcher && matcher.length > 1) {
                    langMap[matcher[1]] = {
                        file: r,
                        lang: matcher[1]
                    };
                }
            });

            let pathMeta = langFallback(langMap, lang);
            return {
                target: pathMeta,
                langMap
            }
        }
    }
    return { target: undefined, langMap: undefined };
}