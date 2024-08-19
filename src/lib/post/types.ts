import type { UserAuthor } from "$lib/interaction/types";
import type { ContactBaseProfile } from "$lib/types";

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

export type PostAttributesContact = string | UserAuthor | ContactBaseProfile;

export interface PostRawAttributes {
    uuid?: string,
    route?: string,
    slug?: string,
    date?: string
    published?: boolean | string | {
        date: string
    },
    modified?: boolean | string | {
        date: string
    },
    author?: PostAttributesContact | PostAttributesContact[],
    contributor?: PostAttributesContact | PostAttributesContact[],
    sponsor?: PostAttributesContact | PostAttributesContact[],
    title?: string,
    taxonomy?: {
        category?: string | string[],
        tag?: string | string[]
        seires?: string | string[]
    },
    keywords?: string | string[],
    visible?: boolean,
    routable?: boolean,
    comment?: PostCommentConfig,
    discuss?: PostDiscussConfig,
    menu?: PostMenuConfig,
    deleted?: boolean | string | {
        date: string
    },
    type?: string,
    syndication?: string | string[] | { [key: string]: string },
    webmention?: {
        enabled?: boolean,
        accept?: boolean,
        pingback?: boolean,
    }
    summary?: string
}

/**
 * Raw object of a markdown file.
 */
export interface PostRaw {
    path: string,
    attributes: PostRawAttributes,
    body: string,
    template?: string,
    lang?: string,
    langs?: string[],
}

export interface PostRoute {
    route: string,
    lang: string | undefined
}

export interface Post extends PostRawAttributes {
    published: {
        date: string
    },
    modified: {
        date: string
    },
    deleted: {
        date: string
    }
    author?: ContactBaseProfile[],
    contributor?: ContactBaseProfile[],
    sponsor?: ContactBaseProfile[],
    taxonomy?: {
        category?: string[],
        tag?: string[],
        series?: string[]
    },
    keywords?: string[],
    content: string;
    headings: any[];
    links: any[];
    processMeta: any;
    syndication?: {
        [key: string]: string
    },

    prism?: boolean;
    katex?: boolean;
    mermaid?: boolean;

    earlier?: string,
    newer?: string,
    status?: 'draft' | 'published' | 'private' |
    'trash' | 'pending' | 'future',
    template?: string,
    lang?: string,
    langs?: string[],
}