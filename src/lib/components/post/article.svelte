<script lang="ts">
    import { t, locale } from "$lib/translations/index.js";
    import Rating from "$lib/ui/rating/index.svelte";
    import License from "$lib/components/license/index.svelte";

    import { IconLanguage } from "@tabler/icons-svelte";

    export let post: any;
    export let systemConfig: any;
    export let siteConfig: any;
</script>

<article>
    <div class="article-header container">
        {#if post.image}
            <img
                class="no-print"
                src={post.image}
                alt=""
                style="max-width: 100%"
            />
        {/if}
        <h1>{post.title}</h1>
        {#if post.template == "item"}
            <div class="article-meta">
                {#if post.author && post.author != systemConfig.user?.default}
                    <span>{post.author}</span>
                {/if}

                {#if post.review}
                    {$t("common.review")}
                    {#if post.review.item?.url}
                        <a
                            style={post.review.rating > 6
                                ? ""
                                : "color: var(--text-color-tertiary)"}
                            href={post.review.item.url}
                            rel={post.review.rating > 6 ? "" : "nofollow"}
                            >{post.review.item.name}</a
                        >
                    {:else}
                        <span>{post.review.item.name}</span>
                    {/if}

                    <Rating value={post.review.rating} />
                {/if}

                <time
                    class="dt-published"
                    datetime={new Date(post.date).toString()}
                >
                    {new Intl.DateTimeFormat($locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                    }).format(new Date(post.date))}
                </time>
            </div>
        {/if}
    </div>
    <div class="article-body container">
        <div class="article-aside no-print">
            {#if post.toc && post.headings}
                <aside class="article-toc">
                    <details>
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
        <div class="article-content">
            {@html post.content}
        </div>
    </div>
    <div class="article-footer container">
        {#if post.template == "item"}
            <div class="article-extra">
                {#if post.license || systemConfig.license?.default || "11"}
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
                            {#if post.author || systemConfig.user?.default}
                                <div class="article-license-meta-item">
                                    <div class="label">
                                        {$t("common.author")}
                                    </div>
                                    <div class="value">
                                        {post.author ||
                                            systemConfig.user.default}
                                    </div>
                                </div>
                            {/if}
                            <div class="article-license-meta-item">
                                <div class="label">
                                    {$t("common.publish_date")}
                                </div>
                                <div class="value">
                                    <time
                                        class="dt-published"
                                        datetime={new Date(
                                            post.date,
                                        ).toString()}
                                    >
                                        {new Intl.DateTimeFormat(
                                            $locale,
                                        ).format(new Date(post.date))}
                                    </time>
                                </div>
                            </div>
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
                        </div>
                    </div>
                {/if}
                <details style="padding: 1rem">
                    <summary>
                        {$t("common.cite")}
                    </summary>
                    <div style="padding-left: 2rem">
                        <details>
                            <summary>APA</summary>
                            <pre>{`${post.author || systemConfig.user.default}. (${new Date(post.date).toISOString().split("T")[0]}). ${siteConfig.title}. ${post.title} [Blog post]. ${siteConfig.url}${post.url}`}</pre>
                        </details>
                        <details>
                            <summary>MLA</summary>
                            <pre>{`${post.author || systemConfig.user.default}. "${post.title}." ${siteConfig.title}, ${new Date(post.date).toISOString().split("T")[0]} ${siteConfig.url}${post.url}. Accessed ${new Date().toISOString().split("T")[0]}`}</pre>
                        </details>
                        <details>
                            <summary>Chicago (CMS)</summary>
                            <pre>{`${post.author || systemConfig.user.default}. "${post.title}." ${siteConfig.title} (Blog), ${new Date(post.date).toISOString().split("T")[0]} ${siteConfig.url}${post.url}`}</pre>
                        </details>
                        <details>
                            <summary>Harvard</summary>
                            <pre>{`${post.author || systemConfig.user.default}. (${new Date(post.date).getFullYear()}). ${post.title}. ${siteConfig.title}. ${siteConfig.url}${post.url}`}</pre>
                        </details>
                        <details>
                            <summary>Vancouver</summary>
                            <pre>{`${post.author || systemConfig.user.default}. ${post.title}. ${siteConfig.title} [Internet]. ${new Date(post.date).toISOString().split("T")[0]}; Available from: ${siteConfig.url}${post.url}`}</pre>
                        </details>
                        <details>
                            <summary>Bibtex</summary>
                            <pre>{`@online{${post.author || systemConfig.user.default}_${new Date(post.date).getFullYear()}_${post.title},
author  = {${post.author || systemConfig.user.default}},
title   = {{${post.title}}},
journal = {${siteConfig.title}},
type    = {Blog},
doi     = {${siteConfig.url}${post.url}},
urldate = {${new Date().toISOString().split("T")[0]}},
date    = {${new Date(post.date).toISOString().split("T")[0]}},
year    = {${new Date(post.date).getFullYear()}},
month   = {${new Date(post.date).getMonth()}},
day     = {${new Date(post.date).getDate()}}
}`}</pre>
                        </details>
                        <details>
                            <summary>CFF</summary>
                            <a href="./CITATION.cff">CITATION.cff</a>
                        </details>
                    </div>
                </details>
                {#if post.taxonomy || post.langs?.length > 0}
                    <div class="article-taxonomy-and-lang no-print">
                        {#if post.taxonomy}
                            <div class="article-taxonomy">
                                {#if post.taxonomy?.category?.length}
                                    <ul>
                                        {#each post.taxonomy.category as category}
                                            <li>
                                                <a
                                                    href="/category/{category.toLowerCase()}/"
                                                    >/{category}</a
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
                                                    href="/tag/{tag.toLowerCase()}/"
                                                    >#{tag}</a
                                                >
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        {/if}
                        {#if post.langs?.length > 0}
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
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    position: absolute;
                    left: -1rem;
                    width: 1rem;
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
            font-size: 90%;
            color: var(--text-color-secondary);
        }
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

        .article-header {
            border-top-left-radius: var(--article-border-radius);
            border-top-right-radius: var(--article-border-radius);
        }

        .article-footer {
            border-bottom-left-radius: var(--article-border-radius);
            border-bottom-right-radius: var(--article-border-radius);
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
        }

        .article-content {
            padding: var(--content-padding);

            @media print {
                padding: 0;
            }
        }

        .article-toc {
            padding: var(--content-padding);
        }

        .article-extra {
            display: flex;
            flex-flow: column;

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