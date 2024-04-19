

import { getPostFolder } from "$lib/interaction/utils";
import { getSiteConfig, getSystemConfig } from "$lib/server/config"
import path from "path";
import fs from 'fs';

/**
 * https://www.bing.com/indexnow/getstarted
 * 
 * ```
POST /IndexNow HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: api.indexnow.org
{
    "host": "www.example.org",
    "key": "34d0a8da0eb84276ace282bf4fb69404",
    "keyLocation": "https://www.example.org/34d0a8da0eb84276ace282bf4fb69404.txt",
    "urlList": [
        "https://www.example.org/url1",
        "https://www.example.org/folder/url2",
        "https://www.example.org/url3"
        ]
}
```
 * @param site 
 * @param url 
 */
export const requestIndexNow = async (site: any, url: string | string[]) => {
    const systemConfig = getSystemConfig(site);
    const key = systemConfig.bing?.indexnow?.key;
    const keyLocation = systemConfig.bing?.indexnow?.location;
    const host = systemConfig.domains?.primary;
    const urlList = [url].flat();
    const body = JSON.stringify({ host, key, keyLocation, urlList });

    console.log('requestIndexNow', body);
    const response = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body
    });
    return response;
}

export const handleRequestIndexNow = async (site: any, { slug, lang }: { slug: string, lang: string }) => {
    const systemConfig = getSystemConfig(site);
    if (!systemConfig.bing?.indexnow?.enabled) {
        return;
    }

    const folder = getPostFolder(site, { slug });
    const filepath = path.join(folder, '/.data/seo/bing/indexnow.json');
    if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    let data: any = {};
    if (fs.existsSync(filepath)) {
        data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    }
    if (data.status !== 200) {
        if (new Date(data.updated).getTime() > new Date().getTime() - 1000 * 60 * 60 * 24 * 1) {
            return data;
        }
        const siteConfig = getSiteConfig(site, lang || getSystemConfig(site).locale?.default);

        const response = await requestIndexNow(site, `${siteConfig.url}${slug}`);
        data = {
            status: response.status,
            updated: new Date().toISOString()
        }
        console.log('response', await response.text());
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    }
    return data;
}