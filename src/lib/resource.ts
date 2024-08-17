import fs from 'fs';
import path from 'path';

/**
 * `path/to/file/item.en.md` => `en`
 * @param filepath
 * @returns 
 */
export function extractLang(filepath: string) {
    let matcher = filepath.match(/[^.]+\.([\w_-]+)\.\w+$/);
    if (matcher) {
        return matcher[1];
    }
}

// `\\`->`/`
export function standardizePath(resourcePath: string) {
    return resourcePath.replace(/\\/g, '/'); // `\\`->`/`
}

/**
 * `path/to/file/item.en.md` => `path/to/file/item.md`
 * @param filepath 
 * @returns 
 */
export function removeLocale(filepath: string) {
    return filepath.replace(/(?<=\.)[\w_-]+\.(?=\w+$)/, '');
}

export interface ResourceLocale {
    lang: string,
    filename: string
}

export interface ResourceWithLocales {
    folder: string,
    default: string,
    locales: ResourceLocale[]
}

export interface ResourceRaw {
    stat: fs.Stats,
    localPath: string,
    name?: string,
    route: string,
    locales: ResourceLocale[],
    standardizedPath: string
}

export function detectResourceLocales(filepath: string): ResourceWithLocales {
    const folder = path.dirname(filepath);
    const equivalentItemPath = removeLocale(filepath);
    const extenion = path.extname(equivalentItemPath);
    const filename = path.basename(filepath);
    const namepart = path.basename(equivalentItemPath, extenion);

    const regexp = new RegExp(`${namepart}\\.([\\w_-]+?)\\${extenion}$`);

    const detector = (file: string) => {
        let matcher = file.match(regexp);
        if (matcher) {
            return { lang: matcher[1], filename: file } as ResourceLocale;
        } else if (file === equivalentItemPath) {
            return { lang: '', filename: file } as ResourceLocale;
        }
    }

    let localeVersions = fs.existsSync(folder)
        ? fs.readdirSync(folder)
            .map(detector)
            .filter(v => !!v) as ResourceLocale[]
        : []

    return {
        folder,
        default: filename,
        locales: localeVersions
    }
}

export function loadRaw(site: any, filepath: string): ResourceRaw | undefined {
    const { POSTS_DIR } = site.constants;

    if (!fs.existsSync(filepath)) {
        console.error(`loadRaw: File not found for '${filepath}'`);
        return;
    }

    let standardizedPath = standardizePath(filepath);

    let stat = fs.statSync(filepath);

    let localPath = standardizedPath.replace(`${standardizePath(POSTS_DIR)}`, '');

    // remove `(dir)` from path
    let tempPath = localPath.replaceAll(/\(.*?\)\//g, '');

    let name = tempPath.split('/').pop();

    // remove `123.` from path
    let route = tempPath.split('/').slice(0, -1).join('/')
        .replace(/\/\d+\./, '/');

    let { locales } = detectResourceLocales(filepath);

    return { stat, localPath, name, route, locales, standardizedPath };
}