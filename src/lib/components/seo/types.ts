export type RobotType =
    | "index"
    | "noindex"
    | "follow"
    | "nofollow"
    | "none"
    | "noarchive"
    | "nosnippet"
    | "noimageindex"
    | "notranslate"
    | "noyaca"
    | "max-snippet:-1"
    | "max-image-preview:large"
    | "max-video-preview:-1"
    | "max-video-preview:-1";

export type Image = {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    secure_url?: string;
    type?: string; // 'image/jpeg' | 'image/png' ...
};

export type Data = {
    title?: string;
    type?: "article" | "website";
    description?: string;
    keywords?: string[] | string;
    image?: string[] | string | Image[] | Image;
    video?: string;
    audio?: string;
    author?: string | string[] | any;
    article?: {
        published_time?: string | Date;
        modified_time?: string | Date;
        sections?: string[];
        tags?: string[];
    };
    robots?: RobotType[] | RobotType;
    googlebot?: "index" | "noindex";
    google?: string;
    rating?: string;
    locale?: string;
    canonical?: string;
    locales?: { lang: string; url: string }[];
    issn?: string;
    siteConfig?: { name: string };
    twitter?: {
        card?: "summary" | "summary_large_image" | "app" | "player";
        site?: string;
        creator?: string;
    };
    reviewed?: {
        item: any;
        rating: {
            value: number;
            best?: number;
            worst?: number;
        };
        body?: string;
    };
    aggregateRating?: {
        value: number;
        count: number;
        best?: number;
        worst?: number;
    };
    app?: string;
};