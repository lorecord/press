<script lang="ts">
    import { t, locales, locale } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ category, posts, label, siteConfig, systemConfig } = data);
</script>

<Title value={`${$t("common.category")}: ${label}`}></Title>
<DescriptionMeta value={`${$t("common.category")}: ${label}`}></DescriptionMeta>

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
        {#if $locale === systemConfig.locale.default}
            {@const url = `${siteConfig.url}/category/${category}/`}
            <link rel="canonical" href={url} />
            <meta property="og:url" content={url} />
        {:else}
            {@const url = `${siteConfig.url}/${$locale}/category/${category}/`}
            <link rel="canonical" href={url} />
            <meta property="og:url" content={url} />
        {/if}

        {#each $locales as value}
            <link
                rel="alternate"
                href="{siteConfig.url}/{value}/category/{category}/"
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
</svelte:head>

<div class="container archives">
    <h1>{$t("common.category")}: {label}</h1>

    <PostTimeline {posts} />
</div>

<style>
    .archives {
        display: flex;
        flex-flow: column;
        align-items: center;
    }
</style>
