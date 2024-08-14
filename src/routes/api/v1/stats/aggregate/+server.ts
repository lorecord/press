import { getEnvConfig, getSystemConfig } from "$lib/server/config";
import { error, json } from "@sveltejs/kit";
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

    // months from timestamp 0 to now
    const months = (new Date().getFullYear() - new Date(0).getFullYear()) * 12 + new Date().getMonth();

    // https://plausible.io/docs/stats-api#number-of-visitors-to-a-specific-page
    const page = url.searchParams.get('event:page');
    return fetch(`https://${plausibleDomain}/api/v1/stats/aggregate?${new URLSearchParams({
        site_id: primaryDomain,
        filters: `event:page==${page}`,
        period: 'custom',
        // 2021-01-01,2021-01-31
        date: [
            new Date(0).toISOString().split('T')[0], // TODO real start date when plausible is enabled
            new Date().toISOString().split('T')[0]].join(','),
        metrics: ['pageviews', 'time_on_page'].join(',')
    })}`, {
        headers: {
            Authorization: `Bearer ${plausibleToken}`,
        },
    }).then((r: Response) => {
        if (!r.ok) {
            console.error(r.status, r.statusText);
            error(500);
        }
        return r.json().then(j => json(j));
    }).catch((e) => {
        console.error(e);
        error(500);
    });
}