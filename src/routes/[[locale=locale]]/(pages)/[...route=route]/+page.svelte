<script lang="ts">
    import { browser } from "$app/environment";
    import Mentions from "$lib/components/interaction/mention/mentions.svelte";
    import Replies from "$lib/components/interaction/replies.svelte";
    import { DescriptionMeta, Title } from "$lib/components/seo";
    import TemplatePage from "$lib/components/template/default.svelte";
    import TemplatePost from "$lib/components/template/item.svelte";
    import TemplateLinks from "$lib/components/template/links.svelte";
    import TemplateNote from "$lib/components/template/note.svelte";
    import TranslationTips from "$lib/components/translations/tips.svelte";
    import { locale, t } from "$lib/translations/index.js";
    import Skeleton from "$lib/ui/skeleton/index.svelte";
    import type {
        CreativeWork,
        Review,
        Article as SchemeArticle,
        WebPage,
        WithContext,
    } from "schema-dts";
    import spdxLicenseList from "spdx-license-list";

    import type { PageData } from "./$types";
    import type { Post } from "$lib/post/types";
    import type { Mention, Reply } from "$lib/interaction/types";

    export let data: PageData;

    $: ({
        post,
        interactions,
        systemConfig,
        siteConfig,
        newer,
        earlier,
        localeContext,
    } = data);

    let replyCounter = 0;

    const commonCommentsFilter = (replies: Reply[]) =>
        replies.filter((r) => r.type === "reply");
    $: commonComments = browser
        ? Promise.resolve(interactions.replies).then(commonCommentsFilter)
        : commonCommentsFilter(interactions.replies as Reply[]);

    const citationsFilter = (mentions: any[]) =>
        mentions.filter(
            (r: any) => r.type === "mention" || r.type === "citation",
        ) || [];
    $: citations = browser
        ? Promise.resolve(interactions.mentions).then(citationsFilter)
        : citationsFilter(interactions.mentions as Mention[]);

    const templates: any = {
        default: TemplatePage,
        item: TemplatePost,
        links: TemplateLinks,
        note: TemplateNote,
    };
    const solveTemplate = (post: Post) =>
        templates[(post.template as string) || "default"] || templates.default;

    $: templateComponent = browser
        ? Promise.resolve(post).then(solveTemplate)
        : solveTemplate(post as Post);

    const ldjsonCreater = (post: Post) => () => {
        const license = ((l) => {
            if (spdxLicenseList[l]) {
                return { licenseId: l, ...spdxLicenseList[l] };
            }
            return { licenseId: l, name: l, url: undefined };
        })(post.license || systemConfig.license?.default);

        let creativeWork: CreativeWork = {
            "@type": "CreativeWork",
            headline: post.title,
            image: post.image?.[0]
                ? [`${siteConfig.url}${post.route}${post.image[0]}`]
                : [`${siteConfig.url}/favicon.png`],

            url: `${siteConfig.url}${post.route}`,
            license: license.url || license.name,
        };

        if (post.published?.date) {
            creativeWork.datePublished = new Date(
                post.published.date,
            ).toISOString();
        }

        if (post.author) {
            let author = post.author.map((author) =>
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

            creativeWork.author = (
                author.length === 1 ? author[0] : author
            ) as any;
        }

        if (post.modified?.date) {
            creativeWork.dateModified = new Date(
                post.modified.date,
            ).toISOString();
        }
        if (post.summary) {
            creativeWork.description = post.summary?.raw;
        }

        if (post.data?.aggregateRating) {
            creativeWork.aggregateRating = {
                "@type": "AggregateRating",
                ratingValue: post.data.aggregateRating.value,
                reviewCount: post.data.aggregateRating.count,
                bestRating: post.data.aggregateRating.best || 10,
                worstRating: post.data.aggregateRating.worst || 1,
            };
        }

        if (post.template == "item") {
            if (post.data?.review) {
                creativeWork = Object.assign(creativeWork, {
                    "@type": "Review",
                    itemReviewed: {
                        "@type": post.data.review.item?.type,
                        name: post.data.review.item?.name,
                        url: post.data.review.item?.url,
                        image: post.data.review.item?.image,
                    },
                    reviewRating: {
                        "@type": "Rating",
                        ratingValue: post.data.review.rating,
                        bestRating: 10,
                        worstRating: 1,
                    },
                    reviewBody: post.data.review.body || post.summary.raw,
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

        return schema;
    };
    $: ldjson = browser
        ? Promise.resolve(post).then(ldjsonCreater)
        : ldjsonCreater(post as Post);
</script>

{#await post then post}
    <Title value={post.title || post.summary.raw}></Title>
    <DescriptionMeta value={post.summary?.raw}></DescriptionMeta>
{/await}

<svelte:head>
    {#await post then post}
        {#if post.webmention?.enabled && post.webmention?.accept}
            <link
                rel="webmention"
                href={systemConfig.webmention?.endpoint || `/api/v1/webmention`}
            />
        {/if}

        {#if post.pingback?.enabled}
            <link
                rel="pingback"
                href={systemConfig.pingback.endpoint || `/api/v1/pingback`}
            />
        {/if}
        {#if post.content?.meta?.prism}
            <link rel="stylesheet" href="/assets/prism/themes/dark.css" />
            <link rel="stylesheet" href="/assets/prism/rehype-prism-plus.css" />
        {/if}
        {#if post.content?.meta?.katex}
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
            />
        {/if}

        {#if post.content?.meta?.mermaid}
            <link rel="stylesheet" href="/assets/mermaid/dark.css" />
            <script
                async
                src="https://unpkg.com/mermaid/dist/mermaid.min.js"
            ></script>
            <script>
                (() => {
                    let observeMermaid = once(() => {
                        var observer = new MutationObserver(function (
                            mutations,
                        ) {
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

        {#if post.published?.date}
            <meta
                name="og:article:published_time"
                content={new Date(post.published.date).toISOString()}
            />
        {/if}

        {#if post.modified?.date}
            <meta
                name="og:article:modified_time"
                content={new Date(post.modified.date).toISOString()}
            />
        {/if}
        {#if post.data?.expired?.date}
            <meta
                name="og:article:expired_time"
                content={new Date(post.data?.expired.date).toISOString()}
            />
        {/if}

        {#if post.author}
            {@const authorString = post.author
                .map((author) => author.name)
                .join(",")}
            <meta name="author" content={authorString} />
            <meta name="og:article:author" content={authorString} />
        {/if}

        {#if post.data?.robots}
            <meta name="robots" content={post.data?.robots.join(",")} />
        {/if}
        {#if post.data?.googlebot}
            <meta name="googlebot" content={post.data?.googlebot} />
        {/if}
        {#if post.data?.google}
            <meta name="google" content={post.data?.google} />
        {/if}
        {#if post.data?.rating}
            <meta name="rating" content={post.data?.rating} />
        {/if}

        {#if post.image?.[0] || post.featured || post.photo}
            {@const image =
                post.featured || post.photo?.[0]?.src || post.image?.[0]}
            <meta
                property="og:image"
                content="{siteConfig.url}{post.route}{image}"
            />
            <meta
                name="twitter:image"
                content="{siteConfig.url}{post.route}{image}"
            />
            <meta name="twitter:card" content="summary_large_image" />
        {:else}
            <meta name="twitter:card" content="summary" />
        {/if}

        {#if post.video?.[0]}
            <meta
                property="og:video"
                content="{siteConfig.url}{post.route}{post.video[0].src}"
            />
        {/if}

        {#if post.audio?.[0]}
            <meta
                property="og:audio"
                content="{siteConfig.url}{post.route}{post.audio[0].src}"
            />
        {/if}

        {#if (post.taxonomy?.category?.length || 0) > 0}
            <meta
                property="og:article:section"
                content={post.taxonomy?.category?.[0]}
            />
        {/if}
        {#if post.taxonomy?.tag}
            {#each post.taxonomy?.tag as tag}
                <meta property="og:article:tag" content={tag} />
            {/each}
        {/if}
        {#if post.taxonomy?.series}
            {#each post.taxonomy?.series as series}
                <meta property="og:article:tag" content={series} />
            {/each}
        {/if}

        {#if post.taxonomy?.category || post.taxonomy?.tag || post.taxonomy?.series || post.keywords}
            <meta
                name="keywords"
                content={`${[
                    post.taxonomy?.category,
                    post.taxonomy?.tag,
                    post.taxonomy?.series,
                    post.keywords,
                ]
                    .filter((s) => !!s)
                    .flat()
                    .join(",")}`}
            />
        {/if}

        {#if siteConfig.url}
            {@const url = `${siteConfig.url}/${post.lang || ""}${post.route}`}
            <link rel="canonical" href={url} />
            <meta property="og:url" content={url} />

            <link
                rel="alternate"
                href={`${siteConfig.url}${post.route}`}
                hreflang="x-default"
            />

            {#each post.langs || [] as value}
                <link
                    rel="alternate"
                    href="{siteConfig.url}/{value}{post.route}"
                    hreflang={value}
                />
            {/each}
        {/if}

        <meta property="og:locale" content={post.lang} />
        {#each post.langs || [] as value}
            {#if value !== $locale}
                <meta property="og:locale:alternate" content={value} />
            {/if}
        {/each}

        {#await ldjson then ldjson}
            {@html `<script type="application/ld+json">${JSON.stringify(
                ldjson(),
            )}</script>`}
        {/await}
    {/await}
</svelte:head>

<div class="h-entry">
    {#await post}
        <div class="page-wrapper">
            <article class="typography">
                <div class="article-header container">
                    <h1 style="text-align: center">
                        <Skeleton width="50%" />
                    </h1>
                    <div class="article-meta" style="text-align: center">
                        <Skeleton width="8rem" />
                    </div>
                </div>
                <div class="article-body container">
                    <div class="e-content article-content">
                        <p>
                            <Skeleton width="100%" />
                            <Skeleton width="100%" />
                            <Skeleton width="67%" />
                        </p>
                        <p>
                            <Skeleton width="100%" />
                            <Skeleton width="100%" />
                            <Skeleton width="33%" />
                        </p>
                    </div>
                </div>
            </article>
        </div>
    {:then post}
        <div class="page-wrapper template-{post.template || 'default'}">
            <TranslationTips {post} {localeContext} />

            {#await templateComponent then templateComponent}
                <svelte:component
                    this={templateComponent}
                    {post}
                    {siteConfig}
                    {systemConfig}
                    {newer}
                    {earlier}
                />
            {/await}
        </div>

        <div class="discuss no-print template-{post.template || 'default'}">
            {#if post.comment?.enabled}
                {#await citations then value}
                    {#if value?.length}
                        <details>
                            <summary style="text-align: center">
                                <h3 id="citations" style="text-align: center">
                                    {$t("common.citations_lead_title")}
                                    {#if value.length}
                                        ({value.length})
                                    {/if}
                                </h3>
                            </summary>
                            <div class="comments-wrapper">
                                <Mentions mentions={value} />
                            </div>
                        </details>
                    {/if}
                {/await}

                {#if post.comment?.reply}
                    <h3 id="comments" style="text-align: center">
                        {$t("common.comment_lead_title")}
                        {#await commonComments then commonComments}
                            {#if commonComments?.length || replyCounter}
                                ({(commonComments.length || 0) + replyCounter})
                            {/if}
                        {/await}
                    </h3>
                {:else}
                    {#await commonComments then commonComments}
                        {#if commonComments?.length || replyCounter}
                            <h3 id="comments" style="text-align: center">
                                {$t("common.comment_lead_title")}
                                ({(commonComments.length || 0) + replyCounter})
                            </h3>
                        {/if}
                    {/await}
                {/if}
                <div class="comments-wrapper">
                    {#await commonComments}
                        <div
                            style="display: flex; flex-flow: column; gap: 1rem;"
                        >
                            {#each { length: 3 } as _, i}
                                <div
                                    style="display: flex; flex-flow: row; gap: 0.25rem;"
                                >
                                    <Skeleton type="avatar" />
                                    <div
                                        style="display: flex; flex-flow: column; gap: 0.25rem; flex: 1"
                                    >
                                        <div>
                                            <Skeleton width="4em" />
                                            <Skeleton width="10em" />
                                        </div>
                                        <Skeleton width="100%" />
                                        <Skeleton width="67%" />
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:then commonComments}
                        <Replies
                            mailto={{
                                enabled:
                                    systemConfig.postal?.enabled &&
                                    systemConfig.email?.sender,
                                email: systemConfig.email?.sender,
                                site: siteConfig.title,
                                title: post.title || "",
                                route: post.route,
                            }}
                            replies={commonComments}
                            gravatarBase={systemConfig.gravatar?.base}
                            reply={post.comment?.reply}
                            reverse={false}
                            {post}
                            postUrl={siteConfig.url + post.route}
                            on:reply={() => replyCounter++}
                            webmentionEndpoint={post.webmention?.enabled &&
                            post.webmention?.accept
                                ? systemConfig.webmention?.endpoint ||
                                  `/api/v1/webmention`
                                : ""}
                        />
                    {/await}
                </div>
            {/if}
        </div>
    {/await}
</div>

<style lang="scss">
    .discuss > * {
        max-width: 45rem;
        margin-left: auto;
        margin-right: auto;
    }
    .comments-wrapper {
        padding: 1rem;
    }

    .page-wrapper {
        padding: 1rem 0;

        @media print {
            padding: 0;
        }
    }
</style>
