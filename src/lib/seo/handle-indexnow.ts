

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
export const requestIndexNow = async (indexTasks: {
    url: string;
    callback: (response: any) => Promise<any>;
}[], extra: {
    key: string;
    keyLocation?: string;
    host: string;
    dataFolder: string;
}) => {
    const urlList = indexTasks.map((t) => t.url);
    const { host, key, keyLocation, dataFolder } = extra;
    const body = JSON.stringify(Object.assign({ host, key, keyLocation, urlList }, keyLocation ? { keyLocation } : {}));

    console.log('requestIndexNow', body);
    const response = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body
    });

    let data = {
        status: response.status,
        updated: new Date().toISOString(),
        body: {
            host, urlList
        },
        response: await response.text()
    }

    const indexNowFolder = path.join(dataFolder, '/seo');
    if (!fs.existsSync(indexNowFolder)) {
        fs.mkdirSync(indexNowFolder, { recursive: true });
    }

    fs.writeFileSync(path.join(indexNowFolder, 'indexnow.json'), JSON.stringify(data, null, 2));

    return response;
}

export const handleRequestIndexNow = async (pages: {
    url: string;
    folder: string;
    modified?: string;
}[], extra: {
    key: string;
    keyLocation?: string;
    host: string;
    dataFolder: string;
}) => {

    let indexTasks = [];

    const { dataFolder } = extra;
    const globalIndexNowFile = path.join(dataFolder, '/seo/indexnow.json');
    let globalIndexNow: any = {};
    if (fs.existsSync(globalIndexNowFile)) {
        globalIndexNow = JSON.parse(fs.readFileSync(globalIndexNowFile, 'utf-8'));
    }

    if (new Date(globalIndexNow.updated).getTime() > new Date().getTime() - 1000 * 60 * 1) {
        return;
    }

    for (const { url, folder, modified } of pages) {
        const filepath = path.join(folder, '/.data/seo/indexnow.json');
        if (!fs.existsSync(path.dirname(filepath))) {
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
        }
        let data: any = {};
        if (fs.existsSync(filepath)) {
            data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        }

        if (data.status !== 200) {
            if (new Date(data.updated).getTime() > new Date().getTime() - 1000 * 60 * 1) {
                continue;
            }

            if (modified && new Date(modified).getTime() < new Date(data.updated).getTime()) {
                continue;
            }

            indexTasks.push({
                url,
                callback: async (response: any) => {
                    data = {
                        status: response.status,
                        updated: new Date().toISOString(),
                        url,
                        response: await response.text()
                    }
                    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
                }
            });
        }
    }

    if (indexTasks.length > 0) {
        // up to 10000 urls per post
        indexTasks = indexTasks.slice(0, 10000);
        const response: any = await requestIndexNow(indexTasks, extra);
        return Promise.all(indexTasks.map((t) => t.callback(response)));
    }
}