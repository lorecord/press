import { getSiteAccount } from '$lib/server/accounts';
import { createSession } from '$lib/server/session';
import type { HashString, Md5HashValue, Sha1HashValue, Sha256HashValue } from '$lib/types';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import crypto from 'crypto';
import { dev } from '$app/environment';

export const actions = {
    default: async ({ locals, request, cookies, url }) => {
        const { site } = locals as { site: any };

        const form = await request.formData();

        const username = form.get("username")?.toString();
        const password = form.get("password")?.toString();
        const remember = form.get("remember")?.toString();

        if (username === undefined || password === undefined) {
            return fail(422, {
                username,
                error: 'Username and password are required.'
            });
        }

        const account = getSiteAccount(site, username, '');

        const passwordHash = account?.credentials?.password as HashString & Md5HashValue & Sha1HashValue & Sha256HashValue;

        if (passwordHash?.sha256) {
            const hash = crypto.createHash('sha256').update(`${username}${password}${passwordHash.salt}`).digest('hex');

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

                return redirect(302,
                    url.searchParams.get('continue') || form.get("continue")?.toString() || '/admin');
            }
        } else {
            if (dev) {
                const salt = crypto.randomBytes(16).toString('base64');
                const hash = crypto.createHash('sha256').update(`${username}${password}${salt}`).digest('hex');

                console.log('try:', JSON.stringify({ username, password, salt, hash }, null, 2));
            }
        }

        return fail(401, {
            username,
            error: 'Invalid username or password.'
        });
    },
} satisfies Actions;