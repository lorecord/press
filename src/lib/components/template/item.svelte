<script lang="ts">
    import Article from "$lib/components/post/article.svelte";
    import {
        IconArrowNarrowLeft,
        IconArrowNarrowRight,
    } from "@tabler/icons-svelte";
    import { t } from "$lib/translations/index.js";

    export let post: any;
    export let systemConfig: any;
    export let siteConfig: any;
    export let newer: any;
    export let earlier: any;

    $: ({ title, summary_html, url, date, image, review } = post);
</script>

<Article {post} {systemConfig} {siteConfig} />

<div class="article-nav container no-print">
    {#if post.template == "item" && ($newer || $earlier)}
        <div class="sublings">
            <div class="newer">
                {#if $newer}
                    <a href={`${$newer.url}`}>
                        <h4>
                            <div>
                                <IconArrowNarrowLeft size={24} />
                                {$t("common.newer")}
                            </div>
                            {$newer.title}
                        </h4>
                    </a>
                {/if}
            </div>
            <div class="earlier">
                {#if $earlier}
                    <a href={`${$earlier.url}`}>
                        <h4>
                            <div>
                                {$t("common.earlier")}
                                <IconArrowNarrowRight size={24} />
                            </div>
                            {$earlier.title}
                        </h4>
                    </a>
                {/if}
            </div>
        </div>
    {/if}

    {#if post.template == "item" && post.related?.length}
        <h3 style="text-align: center">
            {$t("common.related_lead_title")}
        </h3>
        <ul class="related">
            {#each post.related as r}
                <li>
                    <h4>
                        <a href={r.post.url} data-related={r.score}
                            >{r.post.title}</a
                        >
                    </h4>
                </li>
            {/each}
        </ul>
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
            }
        }

        .earlier {
            div {
                justify-content: right;
            }
        }
    }

    .related {
        list-style: none;
        color: var(--text-color-tertiary);
    }

    @media screen and (max-width: 600px) {
        .sublings {
            gap: 0;
            flex-flow: column;
            .newer,
            .earlier {
                div svg {
                    display: none;
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
