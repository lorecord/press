import type { NativeReply } from "./types";

export function commentToInteraction(comment: any): NativeReply {
    return {
        type: 'reply',
        id: comment.id,
        author: {
            name: comment.author,
            email: {
                value: {
                    value: comment.email, // TODO: encrypt
                },
                hash: {
                    md5: comment.email_md5,
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
        }
    }
}