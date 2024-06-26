interface Base {
    id: string;
    published: string;
    type: string;
    channel?: string;
    author?: Author;
    url?: string;
    target?: string;
}

export interface EncryptedString {
    encrypted: string;
    nonce?: string;
    iv?: string;
    algorithm?: string;
    version?: string;
}

export type HashString = {
    salt?: string;
    i?: number;
} & ({
    md5: string;
} | {
    sha256: string;
} | {
    sha1: string;
});


export type Author = {
    name?: string;
    url?: string;
    avatar?: string;
    user?: string;
    email?: {
        value?: EncryptedString;
        hash: HashString
    };
    verifed?: boolean;
}

export interface WebmentionRaw {
    source: string;
}

export interface Reply extends Base {
    type: 'reply';
    content?: string;
    secret?: {
        hash: HashString
    };
}

export type WebmentionReply = {
    channel: 'webmention';
    webmention: WebmentionRaw;
    url: string;
} & Reply;

export type NativeBase = {
    channel: 'native';
    ip?: EncryptedString;
    secret?: HashString;
}

export type NativeReply = NativeBase & Reply;
export type NativeMention = NativeBase & Mention;

export type NativeInteraction = NativeReply | NativeMention;

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