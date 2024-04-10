import { user } from '$lib/stores.js';

export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };

    return new Response(`<script>window.location.href = '/signin?logout';</script>`, {
        status: 200,
        headers: {
            'Set-Cookie': `session; Path=/; Max-Age=0`
        }
    })
}