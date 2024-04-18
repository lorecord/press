import { loadPostRaw } from "$lib/post/handle-posts";
import type { EncryptedString, NativeInteraction, NativeMention, NativeReply } from "./types";
import Crypto from 'crypto';
import path from 'path';
import { env } from '$env/dynamic/private';


export function getInteractionsFoler(site: any, { slug }: { slug: string }) {
    const postRaw = loadPostRaw(site, { route: slug, lang: 'en' });
    if (!postRaw) {
        return '';
    }
    return path.dirname(postRaw.path) + '/.data/interactions/channels/';
}

export function encrypt(value: string, key: string | undefined = env.SECRET_KEY): EncryptedString {
    if (!key) {
        return { value };
    }
    const cipher = Crypto.createCipheriv('aes-256-cbc', key, key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        value: Buffer.from(encrypted).toString('base64'),
        algorithm: 'aes-256-cbc',
    }
}

export function decrypt(encrypted: EncryptedString, key: string | undefined = env.SECRET_KEY): string {

    let encryptedValue;
    let algorithm;
    if (typeof encrypted === 'string') {
        encryptedValue = encrypted;
        algorithm = 'aes-256-cbc';
    } else {
        encryptedValue = Buffer.from(encrypted.value, 'base64').toString('utf8');
        algorithm = encrypted.algorithm;
    }

    if (!key || !algorithm) {
        return encryptedValue;
    }

    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, key);
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export function commentToInteraction(comment: any): NativeInteraction {
    if (comment.type === 'pingback') {
        return {
            type: 'mention',
            channel: 'native',
            id: comment.id || Crypto.createHash('md5').update(comment.url).digest('hex'),
            published: comment.date,
            url: comment.url,
            content: comment.text,
            author: Object.assign({
                name: comment.author,
            }, comment.email ? {
                email: {
                    value: {
                        value: encrypt(comment.email)
                    },
                    hash: {
                        md5: comment.email_md5 || Crypto.createHash('md5').update(comment.email).digest('hex'),
                    }
                },
            } : {})
        } as NativeMention;
    }
    return {
        type: 'reply',
        channel: 'native',
        id: comment.id,
        author: Object.assign({
            name: comment.author,
            url: comment.url,
            user: comment.user,
            verifed: comment.verified,
        }, comment.email ? {
            email: {
                value: {
                    value: encrypt(comment.email)
                },
                hash: {
                    md5: comment.email_md5 || Crypto.createHash('md5').update(comment.email).digest('hex'),
                }
            },
        } : {}),
        published: comment.date,
        content: comment.text,
        ip: encrypt(comment.ip),
        target: comment.reply,
        secret: {
            sha1: comment.secret,
        }
    } as NativeReply;
}