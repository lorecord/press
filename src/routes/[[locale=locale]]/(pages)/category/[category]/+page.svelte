<script lang="ts">
    import { t } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ category, posts, label, siteConfig } = data);
</script>

<Title value={`${$t("common.category")}: ${label}`}></Title>
<DescriptionMeta value={`${$t("common.category")}: ${label}`}></DescriptionMeta>

<svelte:head>
    {#if siteConfig.keywords}
        <meta name="keywords" content={`${label},${siteConfig.keywords.join(",")}`} />
    {:else}
        <meta name="keywords" content={`${label}`} />
    {/if}

    {#if siteConfig.url}
        <link rel="canonical" href={`${siteConfig.url}/category/${category}/`} />
        <meta property="og:url" content={`${siteConfig.url}/category/${category}/`} />
    {/if}
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