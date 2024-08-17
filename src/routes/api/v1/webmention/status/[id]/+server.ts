import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getSiteConfig, getSystemConfig } from "$lib/server/config";

export const POST: RequestHandler = async ({ locals, request }) => {
    const { site } = locals as { site: any };
    const siteConfig = getSiteConfig(site);
    const systemConfig = getSystemConfig(site);

    if (systemConfig.webmention?.enabled !== true) {
        error(404);
    }
    return json({}, { status: 200 });
}