<script lang="ts">
    import { t, locale, locales } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import type { WebPage, WithContext } from "schema-dts";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ posts, siteConfig, pathLocale } = data);

    let ldjson = () => {
        let creativeWork: WebPage = {
            "@type": "WebPage",
        };

        let schema: WithContext<any> = Object.assign(creativeWork, {
            "@context": "https://schema.org",
        });

        return schema;
    };
</script>

<Title value={$t("common.archives")}></Title>
<DescriptionMeta value={$t("common.archives")}></DescriptionMeta>

<svelte:head>
    {#if siteConfig.keywords}
        <meta name="keywords" content={siteConfig.keywords.join(",")} />
    {/if}

    {#if siteConfig.url}
        {@const url = `${siteConfig.url}/${pathLocale || $locale}/archives/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        <link
            rel="alternate"
            href={`${siteConfig.url}/archives/`}
            hreflang="x-default"
        />

        {#each $locales as value}
            <link
                rel="alternate"
                href="{siteConfig.url}/{value}/archives/"
                hreflang={value}
            />
        {/each}
    {/if}

    <meta property="og:type" content="website" />

    <meta property="og:locale" content={$locale} />
    {#each $locales as value}
        {#if value !== $locale}
            <meta property="og:locale:alternate" content={value} />
        {/if}
    {/each}

    {@html `<script type="application/ld+json">${JSON.stringify(
        ldjson(),
    )}</script>`}
</svelte:head>

<div class="container archives">
    <h1>{$t("common.archives")}</h1>

    <PostTimeline {posts} />
</div>

<style lang="scss">
    .archives {
        display: flex;
        flex-flow: column;
        align-items: center;
    }
</style>
