<script lang="ts">
    import { t, locale, locales } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import type { WebPage, WithContext } from "schema-dts";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ posts, siteConfig, systemConfig } = data);

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
        <link
            rel="alternate"
            href={`${siteConfig.url}/archives`}
            hreflang="x-default"
        />
        {#if $locale === systemConfig.locale.default}
            {@const url = `${siteConfig.url}/archives`}
            <link rel="canonical" href={url} />
            <meta property="og:url" content={url} />
        {:else}
            {@const url = `${siteConfig.url}/${$locale}/archives`}
            <link rel="canonical" href={url} />
            <meta property="og:url" content={url} />
        {/if}

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
