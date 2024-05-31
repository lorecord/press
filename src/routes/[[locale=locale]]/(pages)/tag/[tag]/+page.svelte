<script lang="ts">
    import { t, locale, locales } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import type { WebPage, WithContext } from "schema-dts";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ label, tag, posts, siteConfig, systemConfig } = data);

    let ldjson = () => {
        let creativeWork: WebPage = {
            "@type": "WebPage",
            keywords: label,
        };

        let schema: WithContext<any> = Object.assign(creativeWork, {
            "@context": "https://schema.org",
        });

        return schema;
    };
</script>

<Title value={`${$t("common.tag")}: ${label}`}></Title>
<DescriptionMeta value={`${$t("common.tag")}: ${label}`}></DescriptionMeta>

<svelte:head>
    {#if siteConfig.keywords}
        <meta
            name="keywords"
            content={`${label},${siteConfig.keywords.join(",")}`}
        />
    {:else}
        <meta name="keywords" content={`${label}`} />
    {/if}

    {#if siteConfig.url}
        {@const url = `${siteConfig.url}/${$locale}/tag/${tag}/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        <link
            rel="alternate"
            href={`${siteConfig.url}/tag/${tag}/`}
            hreflang="x-default"
        />
        {#each $locales as value}
            <link
                rel="alternate"
                href="{siteConfig.url}/{value}/tag/{tag}/"
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
    <h1>{$t("common.tag")}: {label}</h1>
    <PostTimeline {posts} />
</div>

<style>
    .archives {
        display: flex;
        flex-flow: column;
        align-items: center;
    }
</style>
