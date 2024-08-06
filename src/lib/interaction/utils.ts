import { loadPostRaw } from "$lib/post/handle-posts";
import type { EncryptedString, NativeInteraction, NativeMention, NativeReply } from "./types";
import crypto from 'crypto';
import path from 'path';
import { env } from '$env/dynamic/private';
import { getEnvConfig } from "$lib/server/config";

export function getInteractionsFoler(site: any, { slug }: { slug: string }) {
    const folder = getPostFolder(site, { slug });
    if (folder) {
        return path.join(folder, '/.data/interactions/channels/');
    }
}

export function getPostFolder(site: any, { slug }: { slug: string }) {
    const postRaw = loadPostRaw(site, { route: slug, lang: 'en' });
    if (!postRaw || !postRaw.path) {
        return '';
    }
    return path.dirname(postRaw.path);
}

function resolveKey(site: any, key: string | undefined) {
    return Buffer.from(key || getEnvConfig(site)?.private?.SECRET_KEY || env.SECRET_KEY, 'base64');
}

function genKey() {
    const buffer = crypto.randomBytes(32);
    const encodedKey = buffer.toString('base64');
    return encodedKey;
}

export function encrypt(site: any, value: string, encodedKey: string | undefined = undefined, algorithm: string | undefined = undefined): EncryptedString | undefined {
    if (!value) {
        return;
    }
    const key = resolveKey(site, encodedKey);
    algorithm = algorithm || 'aes-256-gcm';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        encrypted: Buffer.from(encrypted).toString('base64'),
        algorithm,
        iv: iv.toString('hex'),
        version: '1'
    }
}

export function decrypt(site: any, encrypted: EncryptedString, encodedKey: string | undefined = undefined): string {
    if (!encrypted) {
        return '';
    }
    const key = resolveKey(site, encodedKey);

    let encryptedValue;
    let algorithm;
    if (typeof encrypted === 'string') {
        encryptedValue = encrypted;
        algorithm = 'aes-256-gcm';
    } else {
        encryptedValue = Buffer.from(encrypted.encrypted, 'base64').toString();
        algorithm = encrypted.algorithm;
    }

    if (!key || !algorithm) {
        return encryptedValue;
    }

    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(encrypted.iv || '', 'hex'));
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    // decrypted += decipher.final();
    return decrypted;
}

export function commentToInteraction(site: any, comment: any): NativeInteraction {

    function optional(value: any, key: string, callback?: (value: any) => any) {
        return value && value !== '' ? {
            [key]: callback ? callback(value) : value
        } : {};
    }
    if (comment.type === 'pingback') {
        return {
            type: 'mention',
            channel: 'native',
            id: comment.id || crypto.createHash('md5').update(comment.url).digest('hex'),
            published: comment.date,
            url: comment.url,
            content: comment.text,
            author: Object.assign({
                name: comment.author,
            }, optional(comment.email, 'email', () => ({
                value: encrypt(site, comment.email),
                hash: {
                    md5: comment.email_md5 || crypto.createHash('md5').update(comment.email).digest('hex'),
                }
            })),)
        } as NativeMention;
    }
    return Object.assign({
        type: 'reply',
        channel: 'native',
        id: comment.id,
        author: Object.assign({
            name: comment.author,
            verifed: comment.verified,
        },
            optional(comment.user, 'user'),
            optional(comment.url, 'url'),
            optional(comment.email, 'email', () => ({
                value: encrypt(site, comment.email),
                hash: {
                    md5: comment.email_md5 || crypto.createHash('md5').update(comment.email).digest('hex'),
                }
            })),
        ),
        published: comment.date,
        content: comment.text,
        ip: encrypt(site, comment.ip),
    }, optional(comment.reply, 'target')) as NativeReply;

}