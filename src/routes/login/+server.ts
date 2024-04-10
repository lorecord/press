export async function POST({ url, locals, request }) {
    const { site } = locals as { site: any };

    const form = await request.formData();

    const username = form.get("username")?.toString() || '';
    const password = form.get("password")?.toString() || ''

    if (username === 'admin' && password === 'admin') {
        const session = 'to_be_generated';

        return new Response(`<script>window.location.href = '/admin';</script>`, {
            status: 200,
            headers: {
                'Set-Cookie': `session=${session}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=31536000`,
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