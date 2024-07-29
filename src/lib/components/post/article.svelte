<script lang="ts">
    import { t, locale } from "$lib/translations/index.js";
    import Rating from "$lib/ui/rating/index.svelte";
    import License from "$lib/components/license/index.svelte";
    import Cite from "$lib/components/cite/index.svelte";
    import Time from "$lib/ui/time/index.svelte";

    import { IconLanguage } from "@tabler/icons-svelte";

    export let post: any;
    export let systemConfig: any;
    export let siteConfig: any;

    export let header = true;
    export let footer = true;
</script>

<article class="typography" style="--article-bg-color: transparent">
    {#if header}
        <div class="article-header container">
            {#if post.image}
                <img
                    class="no-print"
                    src={post.image}
                    alt=""
                    style="max-width: 100%"
                />
            {/if}

            <h1 class="p-name">{post.title}</h1>

            {#if post.template == "item"}
                <div class="article-meta">
                    {#if post.authors && !post.isDefaultAuthor}
                        {#each post.authors as author}
                            <span
                                >{author.name || author.account || author}</span
                            >
                        {/each}
                    {/if}

                    {#if post.review}
                        <div>
                            {$t("common.review")}
                            {#if post.review.item?.url}
                                <a
                                    class="u-review-of"
                                    style={post.review.rating > 6
                                        ? ""
                                        : "color: var(--text-color-tertiary)"}
                                    href={post.review.item.url}
                                    rel={post.review.rating > 6
                                        ? ""
                                        : "nofollow"}>{post.review.item.name}</a
                                >
                            {:else}
                                <span>{post.review.item.name}</span>
                            {/if}

                            <Rating value={post.review.rating} />
                        </div>
                    {/if}

                    <Time
                        date={post.date}
                        class="dt-published"
                        locale={$locale}
                    />
                </div>
            {/if}

            <div style="display:none">
                <a class="u-url" href={siteConfig.url + post.url}
                    >{post.title}</a
                >
                <p class="p-summary">{post.summary}</p>
            </div>
        </div>
    {/if}
    <div class="article-body container">
        <div class="article-aside no-print">
            {#if post.toc && post.headings}
                <aside class="article-toc">
                    <details open>
                        <summary>
                            <h3>{$t("common.toc")}</h3>
                        </summary>
                        <ul>
                            {#each post.headings as { level, text, id }}
                                <li style="margin-left: {level * 10 - 20}px">
                                    <a href={`#${id}`}>{text}</a>
                                </li>
                            {/each}
                        </ul>
                    </details>
                </aside>
            {/if}
        </div>
        <div class="e-content article-content">
            {@html post.content}
        </div>
    </div>
    {#if footer}
        <div class="article-footer container">
            {#if post.template == "item"}
                <div class="article-extra">
                    <div class="article-license">
                        <div class="article-license-base-info">
                            <div><strong>{post.title}</strong></div>
                            <div>
                                <a
                                    class="link"
                                    href={post.url}
                                    data-print-content-none
                                    >{siteConfig.url}{post.url}</a
                                >
                            </div>
                        </div>
                        <div class="article-license-meta">
                            {#if post.authors}
                                <div class="article-license-meta-item">
                                    <div class="label">
                                        {$t("common.author")}
                                    </div>
                                    <div class="value">
                                        {#each post.authors as author}
                                            <p
                                                style="margin:0"
                                                class="h-card p-author"
                                            >
                                                <a
                                                    class="p-name u-url"
                                                    rel="author"
                                                    href={author.url ||
                                                        siteConfig.url}
                                                    >{author.name ||
                                                        author.account ||
                                                        author}</a
                                                >
                                                <img
                                                    style="display:none"
                                                    alt={author.name ||
                                                        author.account ||
                                                        author}
                                                    class="u-photo"
                                                    src={siteConfig.url +
                                                        "/favicon.png"}
                                                />
                                            </p>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                            <div class="article-license-meta-item">
                                <div class="label">
                                    {$t("common.publish_date")}
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
                                        {$t("common.license")}
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
                                {$t("common.cite")}
                            </summary>
                            <div style="padding-left: 2rem">
                                <Cite
                                    {post}
                                    site={siteConfig.title}
                                    base={siteConfig.url}
                                />
                                <details>
                                    <summary>CFF</summary>
                                    <a href="./CITATION.cff">CITATION.cff</a>
                                </details>
                            </div>
                        </details>
                    </div>
                    {#if post.taxonomy || post.langs?.length > 0}
                        <div class="article-taxonomy-and-lang no-print">
                            {#if post.taxonomy}
                                <div class="article-taxonomy">
                                    {#if post.taxonomy?.series?.length}
                                        <ul>
                                            {#each post.taxonomy.series as series}
                                                <li>
                                                    <a
                                                        class="p-series series"
                                                        href="/series/{series
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/gm,
                                                                '-',
                                                            )}/">{series}</a
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
                                                        class="p-category category"
                                                        href="/category/{category
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/gm,
                                                                '-',
                                                            )}/">{category}</a
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
                                                        class="p-tag tag"
                                                        href="/tag/{tag
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/gm,
                                                                '-',
                                                            )}/">{tag}</a
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
                                                <a href="/{lang}{post.url}"
                                                    >{$t(`lang.${lang}`)}</a
                                                >
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</article>

<style lang="scss">
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

        @media print {
            --article-border: none;
            border-radius: 0;
        }

        .article-header,
        .article-body,
        .article-footer {
            background: var(--article-bg-color);
            border: var(--article-border);
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

        .article-aside {
            position: absolute;
            margin-left: 100%;
            height: 100%;
        }

        .article-toc {
            position: sticky;
            top: 0;
            min-width: calc((100vw - 1024px) / 2 - var(--content-padding));
            a {
                color: var(--text-color-tertiary);
            }

            h3 {
                display: inline-block;
            }
        }

        h1,
        .article-meta {
            text-align: center;
        }

        h1 {
            padding: var(--content-padding) var(--content-padding) 0.5rem
                var(--content-padding);
            margin: 0;
        }

        .article-meta {
            color: var(--text-color-tertiary);

            display: flex;
            gap: 1em;
            justify-content: center;
        }

        .article-content,
        .article-toc {
            padding: var(--content-padding);

            @media screen {
                :global(> *:first-child) {
                    margin-top: 0;
                }
            }

            @media print {
                padding: 0;
            }
        }

        @media screen {
            .article-toc {
                h3 {
                    margin-top: 0;
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

    @media screen and (max-width: 1600px) {
        article {
            .article-aside {
                position: static;
                margin-left: 0;
                height: auto;
            }

            .article-toc {
                position: static;
                min-width: unset;
            }
        }
    }
</style>
