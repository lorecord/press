import { getEnvConfig, getSystemConfig } from "$lib/server/config";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals, request }) => {
    const { site } = locals as any;
    const systemConfig = getSystemConfig(site);

    if (systemConfig.plausible?.enabled !== true) {
        console.error('Plausible is not enabled');
        error(404);
    }

    let envConfig = getEnvConfig(site);

    const primaryDomain = systemConfig.domains?.primary;
    const plausibleDomain = systemConfig.plausible?.domain || 'plausible.io';
    const plausibleToken = envConfig.private?.PLAUSIBLE_APIKEY;

    if (!(plausibleToken && primaryDomain && plausibleDomain)) {
        console.error({ plausibleToken, primaryDomain, plausibleDomain });
        error(404);
    }

    // https://plausible.io/docs/stats-api#get-apiv1statsrealtimevisitors
    return fetch(`https://${plausibleDomain}/api/v1/stats/realtime/visitors?${new URLSearchParams({
        site_id: primaryDomain,
    })}`, {
        headers: {
            Authorization: `Bearer ${plausibleToken}`,
        },
    });
}