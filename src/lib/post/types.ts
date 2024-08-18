import type { Author, UserAuthor } from "$lib/interaction/types";
import type { Account } from "$lib/server/accounts";
import type { ContactBaseProfile } from "$lib/types";

export interface RawAttributes {
    route?: string,
    slug?: string,
    template?: string,
    lang?: string,
}

/**
 * @typedef {Object} Raw
 * 
 * Raw object of a markdown file.
 */
export interface PostRaw {
    path: string,
    attributes: RawAttributes | any,
    body: string,
}

export interface PostCommentConfig {
    enable?: boolean;
    reply?: boolean;
}

export interface PostDiscussConfig {
    enable?: boolean
}

export interface PostMenuConfig {
    header?: boolean,
    footer?: boolean
}

export type PostHeaderContact = string | UserAuthor | ContactBaseProfile;

export interface PostHeader {
    uuid?: string,
    route?: string,
    slug?: string,
    published?: boolean | Date | {
        date: Date
    },
    modified?: boolean | Date | {
        date: Date
    },
    author?: PostHeaderContact | PostHeaderContact[],
    contributor?: PostHeaderContact | PostHeaderContact[],
    sponsor?: PostHeaderContact | PostHeaderContact[],
    title?: string,
    texonomy?: string | {
        category: string | string[],
        tag: string | string[]
        seires: string | string[]
    },
    keywords?: string | string[],
    visible?: boolean,
    routable?: boolean,
    comment?: PostCommentConfig,
    discuss?: PostDiscussConfig,
    menu?: PostMenuConfig,
    deleted?: boolean | Date,
    type?: string,
    syndication?: string | string[] | { [key: string]: string },
    webmention?: {
        enabled?: boolean,
        accept?: boolean,
        pingback?: boolean,
    }
}

export interface PostAttributes extends PostHeader {
    status?: 'draft' | 'published' | 'private' |
    'trash' | 'pending' | 'future',
    template?: string,
    earlier?: string,
    newer?: string,

    prism?: boolean;
    katex?: boolean;
    mermaid?: boolean;
}

export interface PostRoute {
    route: string,
    lang: string | undefined
}

export interface Post extends PostAttributes {
    author?: ContactBaseProfile[],
    contributor?: ContactBaseProfile[],
    sponsor?: ContactBaseProfile[],
    content: string;
    headings: any[];
    links: any[];
    processMeta: any;
}