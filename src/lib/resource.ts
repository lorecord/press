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
    return '';
}

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

export function detectResourceLocales(filepath: string): { folder: string, default: string, locales: { lang: string, filename: string }[] } {
    const folder = path.dirname(filepath);
    const equivalentItemPath = removeLocale(filepath);
    const extenion = path.extname(equivalentItemPath);
    const filename = path.basename(filepath);
    const namepart = path.basename(equivalentItemPath, extenion);

    const regexp = new RegExp(`${namepart}\\.([\\w_-]+?)\\${extenion}$`);

    const detector = (file: string) => {
        let matcher = file.match(regexp);
        if (matcher) {
            return { lang: matcher[1], filename: file };
        } else if (file === equivalentItemPath) {
            return { lang: '', filename: file };
        }
    }

    let localeVersions = fs.existsSync(folder)
        ? fs.readdirSync(folder)
            .map(detector)
            .filter(v => v !== undefined) as { lang: string, filename: string }[]
        : [];

    return {
        folder,
        default: filename,
        locales: localeVersions
    }
}