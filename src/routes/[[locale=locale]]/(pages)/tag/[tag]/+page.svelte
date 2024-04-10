<script lang="ts">
    import { t, locale, locales } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ label, tag, posts, siteConfig } = data);
</script>

<Title value={`${$t("common.tag")}: ${label}`}></Title>
<DescriptionMeta value={`${$t("common.tag")}: ${label}`}></DescriptionMeta>

<svelte:head>
    {#if siteConfig.keywords}
        <meta name="keywords" content={`${label},${siteConfig.keywords.join(",")}`} />
    {:else}
        <meta name="keywords" content={`${label}`} />
    {/if}

    {#if siteConfig.url}
        <link rel="canonical" href={`${siteConfig.url}/tag/${tag}/`} />
        <meta property="og:url" content={`${siteConfig.url}/tag/${tag}/`} />
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