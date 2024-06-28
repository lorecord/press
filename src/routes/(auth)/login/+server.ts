
import { getSiteAccount } from '$lib/server/accouns';
import { createSession } from '$lib/server/session.js';
import crypto from 'crypto';

export async function POST({ url, locals, request, cookies }) {
    const { site } = locals as { site: any };

    const form = await request.formData();

    const username = form.get("username")?.toString() || '';
    const password = form.get("password")?.toString() || '';

    const account = getSiteAccount(site, username, '');

    console.log('account', JSON.stringify(account, null ,2));

    if(account?.credentials?.password?.hash?.sha256){
        const hash = crypto.createHash('sha256').update(`${username}.${password}.${account?.credentials?.password?.salt}`).digest('hex');

        if (hash === account?.credentials?.password?.hash?.sha256) {
            const session = createSession(username);
    
            cookies.set('session', session.id, {
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
        }else{}
    }else{
        const salt = crypto.randomBytes(16).toString('base64');
        const hash = crypto.createHash('sha256').update(`${username}.${password}.${salt}`).digest('hex');

        console.log('try:', JSON.stringify({ username, password, salt, hash }, null, 2));
    }

    return new Response(`<script>window.location.href = '/signin?error';</script>`, {
        status: 401,
        headers: {
            'Content-Type': 'text/html'
        }
    });
}