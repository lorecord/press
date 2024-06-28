export function getPreferredLang(acceptLanguages: string[], availableLangs: string[], defaultLanguage: string) {

    for (const locale of acceptLanguages) {
        if (availableLangs.includes(locale)) {
            return locale;
        }
    }
    for (const locale of acceptLanguages) {
        let lang = locale.split('-')[0];
        let fallbacked = availableLangs.find((l) => l?.startsWith(lang));
        if (fallbacked) {
            return fallbacked;
        }
    }
    for (const locale of acceptLanguages) {
        let lang = locale.split('-')[0];
        if (availableLangs.includes(lang)) {
            return lang;
        }
    }
    return defaultLanguage;
}

export function getPreferredLangFromHeader(acceptLanguageHeader: string, availableLangs: string[], defaultLanguage: string) {
    const acceptLanguages = acceptLanguageHeader.split(',').map((lang) => {
        const [locale, q = '1'] = lang.trim().split(';q=');
        return { locale, q: parseFloat(q) };
    });
    acceptLanguages.sort((a, b) => b.q - a.q);
    return getPreferredLang(acceptLanguages.map((l) => l.locale), availableLangs, defaultLanguage);
}