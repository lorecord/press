import type { Author } from "$lib/interaction/types";
import type { Account } from "$lib/server/accounts";

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
export interface Raw {
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

export interface PostHeader {
    route?: string,
    slug?: string,
    published?: boolean | Date | {
        date: Date
    },
    modified?: boolean | Date | {
        date: Date
    },
    author?: string | Account | Author | (string | Account | Author)[],
    contributor?: string | Account | Author | (string | Account | Author)[],
    sponsor?: string | Account | Author | (string | Account | Author)[],
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
    syndicate?: string | string[] | { [key: string]: string },
    webmention?: {
        enable?: boolean,
        accept?: boolean,
        pingback?: boolean,
    }
}

export interface PostAttributes extends PostHeader {
    published?: boolean | Date | {
        date: Date
    },
    modified?: boolean | Date | {
        date: Date
    },
    status?: 'draft' | 'published' | 'private' |
    'trash' | 'pending' | 'future',
    template?: string,
    ealier?: string,
    newer?: string,

}

export interface PostRoute {
    route: string,
    lang: string | undefined
}

export interface PostProcessed extends PostAttributes {
    content: string;
    headings: any[];
    links: any[];
    processMeta: any;
}