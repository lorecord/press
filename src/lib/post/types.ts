import type { UserAuthor } from "$lib/interaction/types";
import type { ResourceRaw } from "$lib/resource";
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
    title?: string,
    license?: string,
    date?: string,
    published?: boolean | string | {
        date: string
    },
    modified?: boolean | string | {
        date: string
    },
    author?: PostAttributesContact | PostAttributesContact[],
    contributor?: PostAttributesContact | PostAttributesContact[],
    sponsor?: PostAttributesContact | PostAttributesContact[],
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
    },
    summary?: string,
    [key: string]: any,
    toc?: boolean | {
        enabled: boolean
    }
}

/**
 * Raw object of a markdown file.
 */
export interface PostRaw {
    resourceRaw: ResourceRaw,
    path: string,
    attributes: PostRawAttributes,
    body: string,
    template?: string,
    lang?: string,
    langs?: string[],
    route?: string,
    visible?: boolean,
    routable?: boolean,
    slug?: string,
    toc?: {
        enabled: boolean,
    },
    title?: string,
    license?: string,
    published?: {
        date: string
    },
    modified?: {
        date: string
    },
    deleted?: {
        date: string
    },
    author?: ContactBaseProfile[],
    contributor?: ContactBaseProfile[],
    sponsor?: ContactBaseProfile[],
    taxonomy?: {
        category?: string[],
        tag?: string[],
        series?: string[]
    },
    keywords?: string[],

    summary: {
        raw: string;
        html: string;
    }
    syndication?: {
        [key: string]: string
    },
    earlier?: string,
    newer?: string,
    status?: 'draft' | 'published' | 'private' |
    'trash' | 'pending' | 'future',

    data?: { [key: string]: any }
}

export interface PostRoute {
    route: string,
    lang: string | undefined
}

export type Post = Omit<PostRaw, 'resourceRaw' | 'path' | 'attributes' | 'body'> & {
    content?: {
        html: string,
        headings: string[],
        links: string[],
        meta: {
            prism?: boolean;
            katex?: boolean;
            mermaid?: boolean;
            [key: string]: any
        },
    },

}