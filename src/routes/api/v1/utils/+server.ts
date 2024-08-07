import { json } from '@sveltejs/kit';
import crypto from 'crypto';

export async function GET({ url }) {

    const content = url.searchParams.get('content');

    const salt = crypto.randomBytes(16).toString('base64');
    const hash = crypto.createHash('sha256').update(`${content}${salt}`).digest('hex');

    console.log('try:', JSON.stringify({ content, salt, hash }, null, 2));

    return json({ salt, hash });
}