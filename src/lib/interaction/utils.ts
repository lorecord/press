import type { NativeInteraction, NativeMention, NativeReply } from "./types";
import Crypto from 'crypto';

export function commentToInteraction(comment: any): NativeInteraction {
    if (comment.type === 'pingback') {
        return {
            type: 'mention',
            channel: 'native',
            id: comment.id || Crypto.createHash('md5').update(comment.url).digest('hex'),
            published: comment.date,
            url: comment.url,
            content: comment.text,
            author: {
                name: comment.author,
                email: comment.email ? {
                    value: comment.email, // TODO: encrypt
                    hash: {
                        md5: comment.email_md5 || Crypto.createHash('md5').update(comment.email).digest('hex')
                    }
                } : undefined,
            }
        } as NativeMention;
    }
    return {
        type: 'reply',
        channel: 'native',
        id: comment.id,
        author: {
            name: comment.author,
            email: {
                value: {
                    value: comment.email, // TODO: encrypt
                },
                hash: {
                    md5: comment.email_md5 || Crypto.createHash('md5').update(comment.email).digest('hex'),
                }
            },
            url: comment.url,
            user: comment.user,
            verifed: comment.verified,
        },
        published: comment.date,
        content: comment.text,
        ip: {
            value: comment.ip,  // TODO: encrypt
        },
        target: comment.reply
    } as NativeReply;
}