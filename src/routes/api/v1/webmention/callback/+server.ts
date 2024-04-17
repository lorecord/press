import { error, json } from '@sveltejs/kit';
import { getSiteConfig, getSystemConfig } from '$lib/server/config.js';
import { loadPostRaw } from '$lib/post/handle-posts';
import Crypto from 'crypto';
import { deleteMention, saveMention } from '$lib/interaction/handle-webmention.js';

export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };
    const siteConfig = getSiteConfig(site, 'en');
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    const payload = await request.json();

    {
        const secret = systemConfig.webmention?.callback?.secret;
        if (typeof secret === 'string') {
            if (secret !== payload.secret) {
                return new Response('{}', { status: 401 });
            }
        } else if (secret.hash?.md5
            && secret.hash?.md5?.toLowerCase() !== Crypto.createHash('md5').update(`${payload.secret}${secret.hash.salt || ''}`).digest('hex').toLowerCase()) {
            return new Response('{}', { status: 401 });
        } else if (secret.hash?.sha256
            && secret.hash?.sha256?.toLowerCase() !== Crypto.createHash('sha256').update(`${payload.secret}${secret.hash.salt || ''}`).digest('hex').toLowerCase()) {
            return new Response('{}', { status: 401 });
        }
    }

    delete payload.secret;
    const postRoute = payload.target.replace(`${siteConfig.url}/`, '').replace(/\/$/, '');

    const postRaw = await loadPostRaw(site, { route: postRoute, lang: 'en' });

    if (!postRaw) {
        return new Response('{}', { status: 404 });
    }

    if (!payload.deleted) {
        console.log('new webmention from ', payload.source, 'to', payload.target);
        saveMention(site, postRoute, payload);
    } else {
        console.log('webmention from ', payload.source, 'to', payload.target, 'deleted');
        deleteMention(site, postRoute, payload);
    }

    return json('ok');
}