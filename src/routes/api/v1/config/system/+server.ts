import { getSystemConfig } from "$lib/server/config";
import { json } from "@sveltejs/kit";

export function GET({ locals }) {
    const { site } = locals as any;
    let systemConfig = getSystemConfig(site);
    systemConfig = Object.assign({}, systemConfig);
    delete systemConfig.private;

    return json(systemConfig, { status: 200 });
}