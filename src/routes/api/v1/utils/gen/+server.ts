import { json } from '@sveltejs/kit';
import crypto from 'crypto';

export async function GET({ url }) {
    const secret = crypto.randomBytes(32).toString('base64');
    return json({ secret });
}