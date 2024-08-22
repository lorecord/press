<script lang="ts">
    import Article from "$lib/components/post/article.svelte";
    import {
        IconArrowNarrowLeft,
        IconArrowNarrowRight,
    } from "@tabler/icons-svelte";
    import { t, locale } from "$lib/translations/index.js";
    import PostRelated from "$lib/components/post/related.svelte";

    export let post: any;
    export let systemConfig: any;
    export let siteConfig: any;
    export let newer: any;
    export let earlier: any;

    $: ({ title, summary_html, url, date, image, review } = post);
</script>

<Article {post} {systemConfig} {siteConfig} />

<div class="article-nav container no-print">
    {#if post.template == "item" && (newer || earlier)}
        <div class="sublings">
            <div class="newer">
                {#await newer then value}
                    {#if value?.route}
                        <a href={`${value.route}`}>
                            <h4>
                                <div>
                                    <IconArrowNarrowLeft size={24} />
                                    {$t("common.newer")}
                                </div>
                                <span lang={value.lang}>{value.title}</span>
                            </h4>
                        </a>
                    {/if}
                {/await}
            </div>
            <div class="earlier">
                {#await earlier then value}
                    {#if value}
                        <a href={`${value.route}`}>
                            <h4>
                                <div>
                                    {$t("common.earlier")}
                                    <IconArrowNarrowRight size={24} />
                                </div>
                                <span lang={value.lang}>{value.title}</span>
                            </h4>
                        </a>
                    {/if}
                {/await}
            </div>
        </div>
    {/if}

    {#if post.template == "item" && post.related?.length}
        <h3 style="text-align: center">
            {$t("common.related_lead_title")}
        </h3>
        <PostRelated related={post.related} />
    {/if}
</div>

<style lang="scss">
    .sublings {
        display: flex;
        justify-content: space-between;
        padding: 1rem var(--content-padding);
        margin: 1rem 0;
        flex-wrap: wrap;
        color: var(--text-color-tertiary);
        gap: 1rem;

        .newer {
            flex: 1;
        }
        .newer,
        .earlier {
            div {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-color-tertiary);
                font-size: 67%;
            }
        }

        .earlier {
            div {
                justify-content: right;
            }
        }
    }

    @media screen and (max-width: 600px) {
        .sublings {
            gap: 0;
            flex-flow: column;
            .newer,
            .earlier {
                div {
                    :global(svg) {
                        display: none;
                    }
                }
            }

            .earlier {
                div {
                    justify-content: left;
                }
            }
        }
    }
</style>
