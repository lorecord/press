import type { RequestEvent } from "@sveltejs/kit";

/**
 * https://github.com/sveltejs/kit/pull/3993#issuecomment-1046535970
 */
export function getRealClientAddress({ request, getClientAddress }:
    { request: Request, getClientAddress: () => string }
) {
    return request.headers.get("X-Client-IP")
        ?? request.headers.get("X-Forwarded-For")?.split(",")[0].trim() // (Header may return multiple IP addresses in the format: "client IP, proxy 1 IP, proxy 2 IP", so we take the the first one.)
        ?? request.headers.get("CF-Connecting-IP") //(Cloudflare)
        ?? request.headers.get("Fastly-Client-Ip") //(Fastly CDN and Firebase hosting header when forwared to a cloud function)
        ?? request.headers.get("True-Client-Ip") //(Akamai and Cloudflare)
        ?? request.headers.get("X-Real-Ip") //(Nginx proxy/FastCGI)
        ?? request.headers.get("X-Cluster-Client-Ip") //(Rackspace LB, Riverbed Stingray)
        ?? request.headers.get("X-Forwarded")?.split(",")?.[0]?.trim() //(Variations of #2)
        ?? request.headers.get("Forwarded-For")?.split(",")?.[0]?.trim() //(Variations of #2)
        // ?? request.connection?.remoteAddress // (Default nginx proxy/fcgi)
        // ?? request.socket?.remoteAddress // (Node.js remoteAddress)
        // ?? request.connection?.socket?.remoteAddress // (Node.js remoteAddress)
        // ?? request.info?.remoteAddress // (Hapi.js framework)
        ?? getClientAddress();
}

export async function getRequestPayload(request: Request) {
    if (request.method === "GET") {
        return Object.fromEntries([...new URL(request.url).searchParams.entries()]);
    } else if (request.headers.get("content-type")?.includes("multipart/form-data")) {
        // formData  to json
        return Object.fromEntries([...(await request.formData()).entries()]);
    } else if (request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
        return Object.fromEntries([...new URLSearchParams(await request.text()).entries()]);
    } else if (request.headers.get("content-type")?.includes("application/json")) {
        return request.json();
    }

    return {};
}