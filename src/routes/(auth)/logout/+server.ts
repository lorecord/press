import { deleteSession } from '$lib/server/session.js';
import { user } from '$lib/stores.js';

export async function GET({ url, locals, cookies }) {
    const { site } = locals as { site: any };

    let id = cookies.get('session');

    if (id) {
        deleteSession(id);
    }

    cookies.delete('session', { path: '/' });

    return new Response(`<script>window.location.href = '/signin?logout';</script>`, {
        status: 200,
        headers: {
            'Content-Type': 'text/html'
        }
    })
}