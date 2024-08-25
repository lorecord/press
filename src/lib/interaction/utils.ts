import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { fetchPath } from '$lib/handle-path';
import { getEnvConfig } from "$lib/server/config";
import type { EncryptedString, HashValue, Md5HashValue, Sha1HashValue, Sha256HashValue } from '$lib/types';
import crypto from 'crypto';
import path from 'path';
import type { NativeInteraction, NativeMention, NativeReply } from './types';

export function hashStringEquals(a: HashValue, b: HashValue) {
    const { md5: aMd5, sha256: aSha256, sha1: aSha1 } = a as Md5HashValue & Sha256HashValue & Sha1HashValue;
    const { md5: bMd5, sha256: bSha256, sha1: bSha1 } = b as Md5HashValue & Sha256HashValue & Sha1HashValue;

    return (aMd5 && aMd5 == bMd5)
        || (aSha1 && aSha1 == bSha1)
        || (aSha256 && aSha256 == bSha256);
}

export function getInteractionsFoler(site: any, { route }: { route: string }) {
    const folder = getPostFolder(site, { route });
    if (folder) {
        return path.join(folder, '/.data/interactions/channels/');
    }
}

export function getPostFolder(site: any, { route }: { route: string }) {
    const { target } = fetchPath(site, { route, match: (file) => file.endsWith('.md') });

    if (target?.file) {
        return path.dirname(target.file);
    }
}

function resolveKey(site: any, key: string | undefined) {
    return Buffer.from(key || getEnvConfig(site)?.private?.SECRET_KEY || env.SECRET_KEY, 'base64');
}

function genKey() {
    const buffer = crypto.randomBytes(32);
    const encodedKey = buffer.toString('base64');
    return encodedKey;
}

export function hashEmailSha256(value: string) {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
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
            id: comment.id || crypto.createHash('sha256').update(comment.url).digest('hex'),
            published: comment.date,
            url: comment.url,
            content: comment.text,
            author: Object.assign({
                name: comment.author,
            }, optional(comment.email, 'email', () => ({
                value: encrypt(site, comment.email),
                hash: {
                    md5: comment.email_md5 || crypto.createHash('md5').update(comment.email).digest('hex'),
                    sha256: crypto.createHash('sha256').update(comment.email).digest('hex'),
                }
            })),)
        } as NativeMention;
    }
    return Object.assign({
        type: 'reply',
        channel: comment.channel || 'native',
        id: comment.id,
        author: Object.assign({},
            optional(comment.author, 'name'),
            optional(comment.verified, 'verified'),
            optional(comment.user, 'user'),
            optional(comment.url, 'url'),
            optional(comment.email, 'email', () => ({
                value: encrypt(site, comment.email),
                hash: {
                    md5: comment.email_md5 || crypto.createHash('md5').update(comment.email.trim().toLowerCase()).digest('hex'),
                    sha256: crypto.createHash('sha256').update(comment.email.trim().toLowerCase()).digest('hex'),
                }
            })),
        ),
        published: comment.date,
        content: comment.text,
        ip: encrypt(site, comment.ip),
    }, optional(comment.reply, 'target')) as NativeReply;

}

export function calcInteractionId(interaction: any, force: boolean = false) {
    if (interaction.id && !force) {
        return interaction.id + '';
    }
    if (!interaction.secret) {
        interaction.secret = crypto.createHash('sha1').update(JSON.stringify(interaction)).digest('hex');
    }
    return crypto.createHash('sha1').update(`${interaction.secret}`).digest('hex');
}


export function scoreSpam(nativeInteraction: NativeInteraction) {
    // spam detection:
    let score = 0;

    const { author } = nativeInteraction;

    if (author?.verified) {
        if (dev) {
            console.log(`[scoreSpam] author is verified (-2)`);
        }
        score -= 2;
    }

    if (author?.url?.match(/.ru\b/)) {
        if (dev) {
            console.log(`[scoreSpam]`, author.url, 'is .ru, (+ 2)');
        }
        score += 2;
    }

    if (nativeInteraction.type == 'reply') {
        const { content } = nativeInteraction;

        if (content) {
            const text = content.trim();

            const links = text.match(/<a[^>]+>[^<\/a>]*<\/a>/g) || [];
            if (links.length > 0) {
                if (dev) {
                    console.log(`[scoreSpam] links`, links.length, 'in content', '(+', links.length * 3, ')');
                }
                score += links.length * 3;
            }

            const urls = text.match(/https?:\/\/\S+/g) || [];
            if (urls.length > 0) {
                const textUrlNum = Math.max(urls.length - links.length, 0);
                if (dev) {
                    console.log(`[scoreSpam] urls`, textUrlNum, 'in content', '(+', textUrlNum * 2, ')');
                }
                score += textUrlNum * 2;
            }

            const maybeDomains = text.match(/\w+\.[a-zA-Z]{2,}\b/g) || [];
            if (maybeDomains.length > 0) {
                const maybeNum = Math.min(maybeDomains.length - urls.length, 0);
                if (dev) {
                    console.log(`[scoreSpam] maybeDomains`, maybeNum, 'in content', '(+', maybeNum * 0.5, ')');
                }
                score += maybeNum * 0.5;
            }

            const dotRuDomains = text.match(/\w+\.ru\b/g) || [];
            if (dotRuDomains.length > 0) {
                if (dev) {
                    console.log(`[scoreSpam] dotRuDomains`, dotRuDomains.length, `${((dotRuDomains.length / maybeDomains.length) * 100).toFixed(2)}%`, 'in content', '(+', (dotRuDomains.length / maybeDomains.length) * 3, ')');
                }
                score += (dotRuDomains.length / maybeDomains.length) * 3;
            }

            const contentExludeLinks = text
                .replace(/<a[^>]+>[^<\/a>]*<\/a>/g, '')
                .replace(/https?:\/\/\S+/g, '')
                .replace(/\w+\.[a-zA-Z]{2,}\b/g, '');
            if (text.length - contentExludeLinks.length > 0) {
                if (dev) {
                    console.log(`[scoreSpam] links content`, text.length - contentExludeLinks.length, `${((1 - contentExludeLinks.length / text.length) * 100).toFixed(2)}%`, 'in content', '(+', (1 - contentExludeLinks.length / text.length) * 4, ')');
                }
                score += (1 - contentExludeLinks.length / text.length) * 4;
            }
        } else {
            if (dev) {
                console.log(`[scoreSpam] no content in reply`, '(+10)');
            }
            score += 10;
        }
    } else if (nativeInteraction.type == 'mention') {

    }
    return +(Math.round(+(score + "e+2")) + "e-2");
}