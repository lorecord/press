import { dev } from '$app/environment';
import { deleteWebmention, fromWebmentionIO, saveWebmention } from '$lib/interaction/handle-webmention.js';
import { getPostRaw } from '$lib/post/handle-posts';
import { getSiteConfig, getSystemConfig } from '$lib/server/config.js';
import { error, json } from '@sveltejs/kit';
import Crypto from 'crypto';

export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };
    const siteConfig = getSiteConfig(site, 'en');
    const systemConfig = getSystemConfig(site);

    if (!dev || systemConfig.webmention?.enabled !== true) {
        error(404);
    }

    const payload = await request.json();

    console.log('[webmention] webmention.io callback received: ', {
        source: payload.source,
        target: payload.target,
    });

    if (!dev) {
        const secret = systemConfig.webmention?.callback?.secret;
        if (typeof secret === 'string') {
            if (secret !== payload.secret) {
                error(401);
            }
        } else if (secret.hash?.md5
            && secret.hash?.md5?.toLowerCase() !== Crypto.createHash('md5').update(`${payload.secret}${secret.hash.salt || ''}`).digest('hex').toLowerCase()) {
            error(401);
        } else if (secret.hash?.sha256
            && secret.hash?.sha256?.toLowerCase() !== Crypto.createHash('sha256').update(`${payload.secret}${secret.hash.salt || ''}`).digest('hex').toLowerCase()) {
            error(401);
        }
    }

    delete payload.secret;

    console.log('webmention callback payload', payload);

    const target = new URL(payload.target);
    let [, postRoute] = target.pathname.match(/\/(.*)\//) || [];

    let postRaw = getPostRaw(site, undefined, postRoute);

    if (!postRaw?.path) {
        let [lang, route] = postRoute.split('/', 2);
        if (route) {
            postRaw = getPostRaw(site, lang, route);
        }
        postRoute = route;
    }

    if (!postRoute) {
        console.error('[webmention] invalid post route', target.pathname);
        return error(404);
    }

    if (!payload.deleted) {
        console.log('new webmention from ', payload.source, 'to', payload.target);
        saveWebmention(site, postRoute, fromWebmentionIO(payload));
        return json({}, { status: 202 });
    } else {
        console.log('webmention from ', payload.source, 'to', payload.target, 'deleted');
        deleteWebmention(site, postRoute, payload.source);
        return json({}, { status: 202 });
    }
}