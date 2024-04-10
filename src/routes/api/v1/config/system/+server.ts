import { getSystemConfig } from "$lib/server/config";

export function GET({ locals }) {
    const { site } = locals;
    let systemConfig = getSystemConfig(site);

    delete systemConfig.private;

    let body = JSON.stringify(systemConfig);

    return new Response(body, { status: 200 });
}