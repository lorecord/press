
import YAML from 'yaml';
import fs from 'fs';

export function getPreferredLang(acceptLanguages: string[], availableLangs: string[], defaultLanguage: string) {

    for (const locale of acceptLanguages) {
        if (availableLangs.includes(locale)) {
            return locale;
        }
    }
    for (const locale of acceptLanguages) {
        let lang = locale?.split('-')[0];
        let fallbacked = availableLangs.find((l) => l?.startsWith(lang));
        if (fallbacked) {
            return fallbacked;
        }
    }
    for (const locale of acceptLanguages) {
        let lang = locale?.split('-')[0];
        if (availableLangs.includes(lang)) {
            return lang;
        }
    }
    return defaultLanguage;
}

export function getPreferredLangFromHeader(acceptLanguageHeader: string, availableLangs: string[], defaultLanguage: string) {
    return getPreferredLang(getAcceptLanguages(acceptLanguageHeader), availableLangs, defaultLanguage);
}

export function getAcceptLanguages(acceptLanguageHeader: string) {
    const acceptLanguages = acceptLanguageHeader.split(',').map((lang) => {
        const [locale, q = '1'] = lang.trim().split(';q=');
        return { locale, q: parseFloat(q) };
    });

    acceptLanguages.sort((a, b) => b.q - a.q);

    return acceptLanguages.map((l) => l.locale);
}

async function importExternalYAML(filepath: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject();
                return;
            }
            if (!data) {
                resolve({});
                return;
            }
            let parsed = YAML.parse(data);
            resolve(parsed);
        });
    })
}