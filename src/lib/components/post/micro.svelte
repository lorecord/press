<script lang="ts">
    import { t, locale } from "$lib/translations/index.js";
    import License from "$lib/components/license/index.svelte";
    import Cite from "$lib/components/cite/index.svelte";
    import Time from "$lib/ui/time/index.svelte";

    import {
        IconBolt,
        IconExternalLink,
        IconLanguage,
    } from "@tabler/icons-svelte";
    import { onMount } from "svelte";
    import AuthorAvatar from "../interaction/reply/author-avatar.svelte";
    import Title from "../seo/title.svelte";

    export let post: any;
    export let systemConfig: any;
    export let siteConfig: any;

    export let type: "paper" | "none" = "paper";

    export let lightningSupported = false;

    let gravatarBase = systemConfig.gravatar?.base;

    $: author = post.authors?.[0];

    onMount(() => {
        if (typeof (window as any)?.webln !== "undefined") {
            lightningSupported = true;
        }
    });
</script>

<Title value={`${author.name}: "${post.summary}"`}></Title>

<article class="typography type-{type}" lang={post.lang}>
    <div class="article-header container">
        <div
            class="article-publish-meta"
            style="display: flex;
        gap: 1rem;
      }"
        >
            <div
                class="article-author h-card p-author"
                style="display: flex;
            gap: 1rem;
          }"
            >
                <div class="comment-avatar">
                    {#if author?.url}
                        <a
                            href={author?.url}
                            rel="author nofollow"
                            class="u-url"
                        >
                            <AuthorAvatar
                                clazz="u-photo"
                                avatar={author?.avatar}
                                {gravatarBase}
                                alt={author?.name}
                                hash={author?.email_hash}
                            />
                        </a>
                    {:else}
                        <AuthorAvatar
                            clazz="u-photo"
                            avatar={author?.avatar}
                            {gravatarBase}
                            alt={author?.name}
                            hash={author?.email_hash}
                        />
                    {/if}
                </div>
                <span class="p-name" lang={author.lang}>{author?.name}</span>
            </div>
        </div>
    </div>
    <div class="article-body container">
        <div class="e-content article-content">
            {@html post.content}

            {#if post.image}
                <img
                    class="no-print"
                    src={post.image}
                    alt=""
                    style="max-width: 100%"
                />
            {/if}
        </div>
        <div class="article-meta">
            <a
                href="{siteConfig.url}{post.url}"
                rel="bookmark"
                style="color: var(--text-color-tertiary); text-decoration: none"
            >
                <Time date={post.date} class="dt-published" locale={$locale} />
            </a>
        </div>
    </div>
    <div class="article-footer container">
        <div class="article-micro-action">
            {#if systemConfig.lnurlp?.page && lightningSupported}
                <a
                    class="button button-text"
                    style="padding:0; height: auto; display: inline-flex; color: gold"
                    rel="noindex nofollow noopener external"
                    href={systemConfig.lnurlp.page}
                >
                    <IconBolt size={18} />
                </a>
            {/if}
            {#if post.link}
                <a
                    class="button button-text"
                    style="padding:0; height: auto"
                    href={post.link}
                    rel="external noopener nofollow"
                >
                    <IconExternalLink size={18} />
                </a>
            {/if}
        </div>
        <div class="article-extra">
            {#if post.template == "item"}
                <div class="article-license">
                    <div class="article-license-meta">
                        <div class="article-license-meta-item">
                            <div class="label">
                                <span lang={$locale}
                                    >{$t("common.publish_date")}</span
                                >
                            </div>
                            <div class="value">
                                <Time
                                    date={post.date}
                                    class="dt-published"
                                    locale={$locale}
                                />
                            </div>
                        </div>
                        {#if post.license || systemConfig.license?.default}
                            <div class="article-license-meta-item">
                                <div class="label">
                                    <span lang={$locale}
                                        >{$t("common.license")}</span
                                    >
                                </div>
                                <div class="value">
                                    <License
                                        license={post.license ||
                                            systemConfig.license?.default}
                                    />
                                </div>
                            </div>
                        {/if}
                    </div>
                    <details style="padding: 1rem" class="no-print">
                        <summary>
                            <span lang={$locale}>{$t("common.cite")}</span>
                        </summary>
                        <div style="padding-left: 2rem">
                            <Cite
                                {post}
                                site={siteConfig.title}
                                base={siteConfig.url}
                            />
                            <details>
                                <summary>CFF</summary>
                                <a rel="noindex" href="./CITATION.cff"
                                    >CITATION.cff</a
                                >
                            </details>
                        </div>
                    </details>
                </div>
            {/if}

            {#if post.taxonomy || post.langs?.length > 0}
                <div class="article-taxonomy-and-lang no-print">
                    {#if post.taxonomy}
                        <div class="article-taxonomy">
                            {#if post.taxonomy?.series?.length}
                                <ul>
                                    {#each post.taxonomy.series as series}
                                        <li>
                                            <a
                                                rel="tag"
                                                class="p-series series"
                                                href="/series/{series
                                                    .toLowerCase()
                                                    .replace(/\s+/gm, '-')}/"
                                                >{series}</a
                                            >
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                            {#if post.taxonomy?.category?.length}
                                <ul>
                                    {#each post.taxonomy.category as category}
                                        <li>
                                            <a
                                                rel="tag"
                                                class="p-category category"
                                                href="/category/{category
                                                    .toLowerCase()
                                                    .replace(/\s+/gm, '-')}/"
                                                >{category}</a
                                            >
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                            {#if post.taxonomy?.tag?.length}
                                <ul>
                                    {#each post.taxonomy.tag as tag}
                                        <li>
                                            <a
                                                rel="tag"
                                                class="p-tag tag"
                                                href="/tag/{tag
                                                    .toLowerCase()
                                                    .replace(/\s+/gm, '-')}/"
                                                >{tag}</a
                                            >
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    {/if}
                    {#if post.langs?.length > 1}
                        <div class="article-lang">
                            <IconLanguage size={20} />
                            <ul>
                                {#each post.langs as lang}
                                    <li>
                                        <a
                                            rel="alternate"
                                            href="/{lang}{post.url}"
                                            {lang}>{$t(`lang.${lang}`)}</a
                                        >
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</article>

<style lang="scss">
    :global(.comments-wrapper) {
        max-width: 60ch !important;
    }
    :global(article) {
        :global(.article-content) {
            :global(h2),
            :global(h3),
            :global(h4),
            :global(h5),
            :global(h6) {
                position: relative;

                :global(a.heading-anchor-link) {
                    --width: 1.33ch;
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    position: absolute;
                    left: calc(var(--width) * -1);
                    width: var(--width);
                    font-weight: lighter;
                }

                :global(a.heading-anchor-link::before) {
                    content: "¶";
                }

                &:hover {
                    :global(a.heading-anchor-link) {
                        visibility: visible;
                        opacity: 1;
                        text-decoration: none;
                    }
                }
            }
        }
    }

    :global(h2[id^="footnote-label"]) {
        font-size: 105%;
        color: var(--text-color-secondary);

        :global(~ ol) {
            font-size: 85%;
            color: var(--text-color-secondary);
        }
    }

    :global([id^="fn-"] p) {
        margin: 0.333em 0;
    }

    article {
        --article-bg-color: var(--content-bg-color);
        --article-border-radius: var(--content-border-radius);

        --article-border: var(--content-border);

        border-radius: var(--article-border-radius);

        &.type-none {
            --article-bg-color: transparent;
            --article-border: none;
        }

        @media print {
            --article-border: none;
            border-radius: 0;
        }

        .article-header,
        .article-body,
        .article-footer {
            background: var(--article-bg-color);
            border: var(--article-border);
            max-width: 60ch;
            padding: 1ch 3ch;

            @media print {
                padding: 0 !important;
            }
        }

        .article-header {
            padding-top: 2ch;
            padding-bottom: 0;
        }
        .article-footer {
            padding-top: 0;
            padding-bottom: 2ch;
        }

        .article-micro-action {
            display: flex;
            gap: 1rem;
            justify-content: space-between;
        }

        .article-header,
        .article-body {
            border-bottom: 0;
        }

        .article-footer,
        .article-body {
            border-top: 0;
        }

        .article-header,
        .article-footer {
            overflow: hidden;
        }

        > :first-child {
            border-top-left-radius: var(--article-border-radius);
            border-top-right-radius: var(--article-border-radius);
            min-height: var(--article-border-radius);
        }

        > :last-child {
            border-bottom-left-radius: var(--article-border-radius);
            border-bottom-right-radius: var(--article-border-radius);
            min-height: var(--article-border-radius);
        }

        .article-body {
            position: relative;
        }

        .article-meta {
            color: var(--text-color-tertiary);

            display: flex;
            gap: 1em;
        }

        .article-content {
            @media screen {
                :global(> *:first-child) {
                    margin-top: 0;
                }
                :global(> *:last-child) {
                    margin-bottom: 0;
                }
            }
        }

        .article-extra {
            display: flex;
            flex-flow: column;
            flex-wrap: wrap;

            ul {
                display: flex;
                gap: 1rem;
                padding-left: 0;
                margin: 0;
                flex-wrap: wrap;
            }

            li {
                list-style: none;
            }

            > :nth-child(odd) {
                background-color: var(--pane-bg-color);
            }

            > :nth-child(even) {
                background: unset;
            }

            .article-license {
                padding: 1rem var(--content-padding);
                display: flex;
                gap: 1rem;
                flex-flow: column;
                color: var(--text-color-secondary);

                a {
                    color: unset;
                }
                a.link {
                    font-size: 80%;
                    text-decoration: underline;
                    color: var(--text-color-tertiary);
                }

                .article-license-meta {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .article-license-meta-item {
                    .label {
                        font-size: 80%;
                        color: var(--text-color-tertiary);
                    }
                }
            }

            .article-taxonomy-and-lang {
                display: flex;
                justify-content: space-between;

                @media screen and (max-width: 600px) {
                    flex-flow: column;
                }
            }

            .article-taxonomy {
                display: flex;
                gap: 2rem;
                flex-wrap: wrap;
                padding: 1rem var(--content-padding);

                a {
                    color: var(--text-color-tertiary);
                }

                .series::before {
                    content: "+";
                }
                .category::before {
                    content: "/";
                }
                .tag::before {
                    content: "#";
                }
            }

            .article-lang {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                align-items: center;
                padding: 1rem var(--content-padding);

                a {
                    color: var(--text-color-tertiary);
                }
            }
        }
    }

    @media screen and (max-width: 600px) {
        h3 {
            padding-left: var(--content-padding);
        }
    }
</style>
