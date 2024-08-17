import { getSiteAccount } from '$lib/server/accounts';
import { createSession } from '$lib/server/session';
import type { HashString, Md5HashValue, Sha1HashValue, Sha256HashValue } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import crypto from 'crypto';

export const actions = {
    default: async ({ locals, request, cookies }) => {
        const { site } = locals as { site: any };

        const form = await request.formData();

        const username = form.get("username")?.toString() || '';
        const password = form.get("password")?.toString() || '';
        const remember = form.get("remember")?.toString() || '';
        const continuePath = form.get("continue")?.toString() || '';

        const account = getSiteAccount(site, username, '');

        console.log('account', JSON.stringify(account, null, 2));

        const passwordHash = account?.credentials?.password as HashString & Md5HashValue & Sha1HashValue & Sha256HashValue;

        if (passwordHash?.sha256) {
            const hash = crypto.createHash('sha256').update(`${username}${password}${account?.credentials?.password?.salt}`).digest('hex');

            if (hash === passwordHash.sha256) {
                const session = createSession(username);

                cookies.set('session', session.id, remember ? {
                    path: '/',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24 * 365
                } : {
                    path: '/',
                    sameSite: 'strict'
                });

                return redirect(200, continuePath ?? '/admin');
            } else {
                return redirect(401, '/signin?error');
            }
        } else {
            const salt = crypto.randomBytes(16).toString('base64');
            const hash = crypto.createHash('sha256').update(`${username}${password}${salt}`).digest('hex');

            console.log('try:', JSON.stringify({ username, password, salt, hash }, null, 2));
        }

        return redirect(500, '/signin?error');
    },
} satisfies Actions;