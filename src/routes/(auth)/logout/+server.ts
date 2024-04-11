import { user } from '$lib/stores.js';

export async function POST({ url, locals, cookies }) {
    const { site } = locals as { site: any };

    cookies.delete('session', { path: '/' });

    return new Response(`<script>window.location.href = '/signin?logout';</script>`, {
        status: 200,
    })
}