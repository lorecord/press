<script lang="ts">
    import { t, locale } from "$lib/translations/index.js";
    import Card from "$lib/ui/card/index.svelte";
    import Time from "$lib/ui/time/index.svelte";
    import "./card.css";
    import Rating from "$lib/ui/rating/index.svelte";

    export let post: any = {};
    export let showContent: boolean = true;

    $: ({ title, summary_html, url, date, image, review } = post);
</script>

<Card tag="article" class="article">
    <svelte:fragment slot="header">
        <h2><a href={`${url}`}>{title}</a></h2>
    </svelte:fragment>
    <svelte:fragment slot="header-extra">
        <div class="article-meta">
            <Time {date} class="dt-published" locale={$locale} />
        </div>
    </svelte:fragment>
    {#if showContent}
        <div class="content">
            {#if image}
                <div
                    class="feature_image"
                    style="background-image:url('{url}{image}')"
                ></div>
            {/if}
            <div>
                {#if review}
                    <div
                        style="color: var(--text-color-tertiary); font-size: 90%"
                    >
                        <span>{$t("common.review")}</span>

                        <span>{review.item.name}</span>

                        <Rating value={review.rating} />
                    </div>
                {/if}

                {#if summary_html}
                    <div class="summary">
                        {#key summary_html}
                            {@html summary_html}
                        {/key}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</Card>

<style lang="scss">
    :global(.card.article) {
        position: relative;
    }

    h2 {
        margin-bottom: 0;
        flex: 1;
        font-size: 1.33rem;

        @media screen and (max-width: 600px) {
            font-size: 1.222rem;
        }

        a {
            &::before {
                content: " ";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
        }
    }

    .article-meta {
        color: var(--text-color-tertiary);
    }

    .content {
        display: flex;
        gap: 1rem;
        padding-bottom: 1rem;
    }

    .feature_image {
        overflow: hidden;
        border-radius: var(--content-border-radius);
        flex: 0 0 33%;
        background-size: cover;
        min-height: 6rem;
        background-position: center center;
    }

    @media screen and (max-width: 600px) {
        .article-meta {
            padding-top: 0;
        }
        .content {
            flex-flow: column;
        }
        .feature_image {
            flex: 0 0 100%;
        }
    }
</style>
