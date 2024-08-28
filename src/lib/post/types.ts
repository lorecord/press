import type { UserAuthor } from "$lib/interaction/types";
import type { ResourceRaw } from "$lib/resource";
import type { ContactBaseProfile } from "$lib/types";

export interface PostCommentConfig {
    enabled?: boolean;
    reply?: boolean;
}

export interface PostDiscussConfig {
    enabled?: boolean
}

export interface PostMenuConfig {
    header?: boolean,
    footer?: boolean,
    label?: string,
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
        series?: string | string[]
    },
    category?: string | string[],
    tag?: string | string[]
    series?: string | string[],
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
    pingback?: boolean | {
        enabled?: boolean
    },
    webmention?: boolean | {
        enabled?: boolean,
        accept?: boolean,
    },
    summary?: string,
    toc?: boolean | {
        enabled: boolean
    },
    featured?: string,
    image?: string | string[],
    video?: string | string[] | { [key: string]: string } | { [key: string]: string }[],
    audio?: string | string[] | { [key: string]: string } | { [key: string]: string }[],
    photo?: string | string[] | { [key: string]: string } | { [key: string]: string }[],
    [key: string]: any,
}

/**
 * Raw object of a markdown file.
 */
export interface PostRaw {
    resourceRaw: ResourceRaw,
    path: string,
    attributes: PostRawAttributes,
    body: string,
    template: string,
    lang?: string,
    langs?: string[],
    route: string,
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
    comment?: PostCommentConfig,
    discuss?: PostDiscussConfig,
    menu?: PostMenuConfig,
    pingback?: {
        enabled?: boolean
    },
    webmention?: {
        enabled?: boolean,
        accept?: boolean,
    },
    featured?: string,
    image?: string[],
    video?: { [key: string]: string }[],
    audio?: { [key: string]: string }[],
    photo?: { [key: string]: string }[],
    data?: { [key: string]: any }
}

export interface PostRoute {
    route: string,
    lang: string | undefined
}

export type Post = Omit<PostRaw, 'resourceRaw' | 'path' | 'attributes' | 'body'> & {
    content?: {
        html: string,
        headings: {
            level: number,
            text: string,
            id: string
        }[],
        links: {
            href: string, type: string, content: string
        }[],
        meta: {
            prism?: boolean;
            katex?: boolean;
            mermaid?: boolean;
            [key: string]: any
        },
    },

}