import type { ContactBaseProfile, EncryptedString, HashString } from "$lib/types";

interface Base {
    id: string;
    published: string;
    type: string;
    channel?: string;
    author?: Author;
    url?: string;
    target?: string;
    lang?: string;
}

export type UserAuthor = {
    user?: string;
} & ContactBaseProfile;

export type VerifiedAuthor = {
    verified?: boolean;
} & ContactBaseProfile;


export type Author = UserAuthor | VerifiedAuthor | ContactBaseProfile;

export interface WebmentionRaw {
    source: string;
    status: 'ok' | 'deleted' | 'fail' | 'blocked' | 'pending' | 'spam';
}

export interface Reply extends Base {
    type: 'reply';
    content?: string;
    secret?: {
        hash: HashString
    };
    spam?: boolean;
    approved?: boolean; // default value?
}

export interface WebmentionBase extends Base {
    channel: 'webmention';
    webmention: WebmentionRaw;
    created: string;
    updated: string;
}

export type NativeBase = {
    channel: 'native';
    ip?: EncryptedString;
    secret?: HashString;
}

export type EmailBase = {
    channel: 'email';
    messageId: string;
}

export type NativeReply = NativeBase & Reply;
export type NativeMention = NativeBase & Mention;

export type NativeInteraction = NativeReply | NativeMention;

export type WebmentionReply = WebmentionBase & Reply;
export type WebmentionMention = WebmentionBase & Mention;
export type WebmentionInteraction = WebmentionReply | WebmentionMention;

export type EmailReply = EmailBase & Reply;
export type EmailInteraction = EmailReply;

export interface Like extends Base {
    type: 'like';
}

export interface Repost extends Base {
    type: 'repost';
}

export interface Bookmark extends Base {
    type: 'bookmark';
}

export interface Mention extends Base {
    type: 'mention';
    title?: string;
}

export interface Reaction extends Base {
    type: 'reaction';
}

export interface Citation extends Base {
    type: 'cite';
}

export interface Sponsor extends Base {
    type: 'sponsor';
}

export interface Vote extends Base {
    type: 'vote';
}

export interface Purchase extends Base {
    type: 'purchase';
}

export interface Subscription extends Base {
    type: 'subscription';
}

export interface Donation extends Base {
    type: 'donation';
}

export interface Wait extends Base {
    type: 'wait';
}

export interface Tip extends Base {
    type: 'tip';
}

export type Interaction = Reply | Like | Repost | Bookmark | Mention | Citation | Sponsor | Reaction;