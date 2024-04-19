<script lang="ts">
    import Replies from "$lib/components/interaction/replies.svelte";
    import { t, locale } from "$lib/translations/index.js";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import { IconLanguage } from "@tabler/icons-svelte";
    import TemplatePage from "$lib/components/template/default.svelte";
    import TemplatePost from "$lib/components/template/item.svelte";
    import TemplateLinks from "$lib/components/template/links.svelte";
    import type {
        WithContext,
        Article as SchemeArticle,
        Review,
        CreativeWork,
        WebPage,
    } from "schema-dts";
    import Mentions from "$lib/components/interaction/mention/mentions.svelte";

    export let data;

    $: ({
        post,
        interactions,
        systemConfig,
        siteConfig,
        newer,
        earlier,
        ldjson,
    } = data);

    $: commonComments = interactions.replies?.filter(
        (r: any) => r.type === "reply",
    );
    $: citations =
        interactions.mentions?.filter(
            (r: any) => r.type === "mention" || r.type === "citation",
        ) || [];

    const templates: any = {
        default: TemplatePage,
        item: TemplatePost,
        links: TemplateLinks,
    };

    let templateComponent: any;

    $: templateComponent =
        templates[(post.template as string) || "default"] || templates.default;

    let json = () => {
        let creativeWork: CreativeWork = {
            "@type": "CreativeWork",
            headline: post.title,
            image: post.image
                ? [`${siteConfig.url}${post.url}${post.image}`]
                : [`${siteConfig.url}/favicon.png`],
            datePublished: new Date(post.date).toISOString(),
            url: `${siteConfig.url}${post.url}`,
        };

        if (post.authors) {
            let author = post.authors.map((author: any) =>
                Object.assign(
                    {
                        "@type": "Person",
                        name: author.name,
                    },
                    author.url
                        ? {
                              url: author.url,
                          }
                        : {},
                ),
            );
            if (author.length === 1) {
                author = author[0];
            }
            creativeWork.author = author;
        }

        if (post.modified?.date) {
            creativeWork.dateModified = new Date(
                post.modified.date,
            ).toISOString();
        }
        if (post.summary) {
            creativeWork.description = post.summary;
        }

        if (post.aggregateRating) {
            creativeWork.aggregateRating = {
                "@type": "AggregateRating",
                ratingValue: post.aggregateRating.value,
                reviewCount: post.aggregateRating.count,
                bestRating: post.aggregateRating.best || 10,
                worstRating: post.aggregateRating.worst || 1,
            };
        }

        if (post.template == "item") {
            if (post.review) {
                creativeWork = Object.assign(creativeWork, {
                    "@type": "Review",
                    itemReviewed: {
                        "@type": post.review.item?.type,
                        name: post.review.item?.name,
                        url: post.review.item?.url,
                        image: post.review.item?.image,
                    },
                    reviewRating: {
                        "@type": "Rating",
                        ratingValue: post.review.rating,
                        bestRating: 10,
                        worstRating: 1,
                    },
                    reviewBody: post.review.body || post.summary,
                } as Review);
            } else {
                creativeWork = Object.assign(creativeWork, {
                    "@type": "Article",
                } as SchemeArticle);
            }
        } else if (post.template == "links") {
            creativeWork = creativeWork as WithContext<CreativeWork>;
        } else if (post.template == "default") {
            creativeWork = Object.assign(creativeWork, {
                "@type": "WebPage",
            } as WebPage);
        } else {
            creativeWork = creativeWork as WithContext<CreativeWork>;
        }

        let schema: WithContext<any> = Object.assign(creativeWork, {
            "@context": "https://schema.org",
        });

        return Object.assign({}, ldjson, schema);
    };
</script>

<Title value={post.title}></Title>
{#if post.summary}
    <DescriptionMeta value={post.summary}></DescriptionMeta>
{/if}

<svelte:head>
    {#if post.processMeta?.prism}
        <link rel="stylesheet" href="/assets/prism/themes/dark.css" />
        <link rel="stylesheet" href="/assets/prism/rehype-prism-plus.css" />
    {/if}
    {#if post.processMeta?.katex}
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
        />
    {/if}

    {#if post.processMeta?.mermaid}
        <link rel="stylesheet" href="/assets/mermaid/dark.css" />
        <script
            async
            src="https://unpkg.com/mermaid/dist/mermaid.min.js"
        ></script>
        <script>
            (() => {
                let observeMermaid = once(() => {
                    var observer = new MutationObserver(function (mutations) {
                        if (
                            mutations &&
                            mutations.some((m) => {
                                for (n of m.addedNodes) {
                                    if (n.classList?.contains("mermaid")) {
                                        return true;
                                    }
                                }
                            })
                        ) {
                            initMermaid();
                        }
                    });

                    var config = { childList: true, subtree: true };
                    observer.observe(document.body, config);
                });

                function initMermaid() {
                    mermaid && mermaid.init(undefined, ".mermaid");
                    return true;
                }

                let startMermaid = single(() => {
                    observeMermaid();
                    return initMermaid();
                });

                window.whenLoad(handleMermaid);

                function handleMermaid() {
                    if (window.mermaid) {
                        startMermaid();
                    } else {
                        setTimeout(handleMermaid, 100);
                    }
                }

                document.addEventListener(
                    "DOMContentLoaded",
                    handleMermaid,
                    false,
                );
            })();
        </script>
    {/if}

    <script>
        (() => {
            let selector = [2, 3, 4, 5, 6]
                .map((i) => `.article-content h${i}`)
                .join(",");

            function addAnchorLink(h) {
                if (!h.id || h.querySelector(".heading-anchor-link")) {
                    return;
                }

                var link = document.createElement("a");
                link.href = "#" + h.id;
                link.innerText = "¶";
                link.className = "heading-anchor-link";
                h.prepend(link);
            }

            let observeAnchorLink = once(() => {
                var observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        mutation.addedNodes.forEach(function (node) {
                            document
                                .querySelectorAll(selector)
                                .forEach(addAnchorLink);
                        });
                    });
                });

                var config = { childList: true, subtree: true };
                observer.observe(document.body, config);
            });

            function initAnchorLink() {
                observeAnchorLink();
                document.querySelectorAll(selector).forEach(addAnchorLink);
            }

            window.whenLoad(initAnchorLink);
        })();
    </script>

    {#if post.template == "item"}
        <meta property="og:type" content="article" />
    {:else}
        <meta property="og:type" content="website" />
    {/if}

    {#if post.date}
        <meta
            name="og:article:published_time"
            content={new Date(post.date).toISOString()}
        />
    {/if}

    {#if post.modified?.date}
        <meta
            name="og:article:modified_time"
            content={new Date(post.modified.date).toISOString()}
        />
    {/if}
    {#if post.expired?.date}
        <meta
            name="og:article:modified_time"
            content={new Date(post.expired.date).toISOString()}
        />
    {/if}

    <meta name="author" content={post.author || systemConfig.user?.default} />

    {#if post.robots}
        <meta name="robots" content={post.robots.join(",")} />
    {/if}
    {#if post.googlebot}
        <meta name="googlebot" content={post.googlebot} />
    {/if}
    {#if post.googlebot}
        <meta name="google" content={post.google} />
    {/if}
    {#if post.rating}
        <meta name="rating" content={post.rating} />
    {/if}

    {#if post.image}
        <meta
            property="og:image"
            content="{siteConfig.url}{post.url}{post.image}"
        />
        <meta
            name="twitter:image"
            content="{siteConfig.url}{post.url}{post.image}"
        />
    {/if}

    {#if post.video}
        <meta
            property="og:video"
            content="{siteConfig.url}{post.url}{post.video}"
        />
    {/if}

    {#if post.audio}
        <meta
            property="og:audio"
            content="{siteConfig.url}{post.url}{post.audio}"
        />
    {/if}

    {#if post.author}
        <meta name="author" content={post.author} />
        <meta name="og:article:author" content={post.author} />
    {/if}

    {#if post.taxonomy?.category?.length > 0}
        <meta
            property="og:article:section"
            content={post.taxonomy?.category[0]}
        />
    {/if}
    {#if post.taxonomy?.tag}
        {#each post.taxonomy?.tag as tag}
            <meta property="og:article:tag" content={tag} />
        {/each}
    {/if}

    {#if post.taxonomy?.category || post.taxonomy?.tag || post.keywords}
        <meta
            name="keywords"
            content={`${[
                post.taxonomy?.category,
                post.taxonomy?.tag,
                post.keywords,
            ]
                .filter((s) => !!s)
                .flat()
                .join(",")}`}
        />
    {/if}

    {#if siteConfig.url}
        <link rel="canonical" href="{siteConfig.url}{post.url}" />
        <link
            rel="alternate"
            href="{siteConfig.url}{post.url}"
            hreflang="x-default"
        />
        <meta property="og:url" content="{siteConfig.url}{post.url}" />
    {/if}

    <meta property="og:locale" content={post.lang} />

    {#each post.langs || [] as value}
        <link
            rel="alternate"
            href="{siteConfig.url}/{value}{post.url}"
            hreflang={value}
        />
        <meta property="og:locale:alternate" content={value} />
    {:else}
        <link
            rel="alternate"
            href="{siteConfig.url}{post.url}"
            hreflang={systemConfig.locale?.default}
        />
        <meta
            property="og:locale:alternate"
            content={systemConfig.locale?.default}
        />
    {/each}

    {#if systemConfig.webmention?.enabled}{/if}

    {@html `<script type="application/ld+json">${JSON.stringify(
        json(),
    )}</script>`}
</svelte:head>

<div class="h-entry">
    <div class="page-wrapper">
        {#if post.lang && post.lang != $locale}
            <div class="container">
                <div class="alert alert-info no-print">
                    <strong
                        style="display: flex; align-items: center; gap: .25rem;"
                        ><IconLanguage size={18} />
                        {$t("common.i18n_alert_title")}</strong
                    >
                    <span>
                        {$t("common.i18n_alert_message_a")}<a
                            href="/{post.lang}{post.url}"
                            >{$t(
                                `lang.${post.lang || systemConfig.locale.default}`,
                            )}</a
                        >{#if post.langs?.length > 1}{$t(
                                "common.i18n_alert_message_b",
                            )}{#each post.langs as l, index}{#if l !== (post.lang || systemConfig.locale.default)}<a
                                        href="/{l}{post.url}"
                                        >{$t(`lang.${l}`)}</a
                                    >{#if index < post.langs.length - 2}{$t(
                                            "common.comma",
                                        )}{/if}{/if}{/each}{$t(
                                "common.i18n_alert_message_c",
                            )}{/if}
                    </span>
                </div>
            </div>
        {/if}

        <svelte:component
            this={templateComponent}
            {post}
            {siteConfig}
            {systemConfig}
            {newer}
            {earlier}
        />
    </div>

    <div class="discuss no-print">
        {#if post.comment?.enable}
            {#if citations?.length}
                <h3 id="citations" style="text-align: center">
                    {$t("common.citations_lead_title")}
                    {#if citations.length}
                        ({citations.length})
                    {/if}
                </h3>
                <div class="comments-wrapper">
                    <Mentions mentions={citations} />
                </div>
            {/if}
            <h3 id="comments" style="text-align: center">
                {$t("common.comment_lead_title")}
                {#if commonComments?.length}
                    ({commonComments.length})
                {/if}
            </h3>
            <div class="comments-wrapper">
                <Replies
                    replies={commonComments}
                    gravatarBase={systemConfig.gravatar?.base}
                    reply={post.comment?.reply}
                    {post}
                    postUrl={siteConfig.url + post.url}
                    webmentionEndpoint={`https://webmention.io/${systemConfig.domains?.default}/webmention`}
                />
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .comments-wrapper {
        padding: 1rem;
        max-width: 45rem;
        margin-left: auto;
        margin-right: auto;
    }

    .page-wrapper {
        padding: 1rem 0;

        @media print {
            padding: 0;
        }
    }
</style>
