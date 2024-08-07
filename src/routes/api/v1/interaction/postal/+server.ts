import { getSystemConfig } from "$lib/server/config";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import Crypto from 'crypto';

export const POST: RequestHandler = async ({ params, locals, request }) => {
    const { site } = locals as any;
    const systemConfig = getSystemConfig(site);

    const payload = await request.json();

    if (systemConfig.postal?.enabled !== true) {
        error(404);
    }

    {
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

    console.log('[interaction/postal] POST', json);

    return json(null, { status: 200 });
}