export async function POST({ url, locals, request, cookies }) {
    const { site } = locals as { site: any };

    const form = await request.formData();

    const username = form.get("username")?.toString() || '';
    const password = form.get("password")?.toString() || ''

    if (username === 'admin' && password === 'admin') {
        const session = 'to_be_generated';

        cookies.set('session', session, {
            path: '/',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 365
        });

        return new Response(`<script>window.location.href = '/admin';</script>`, {
            status: 200,
            headers: {
                'Content-Type': 'text/html'
            }
        });
    } else {
        return new Response(`<script>window.location.href = '/signin?error';</script>`, {
            status: 401,
            headers: {
                'Content-Type': 'text/html'
            }
        });
    }
}