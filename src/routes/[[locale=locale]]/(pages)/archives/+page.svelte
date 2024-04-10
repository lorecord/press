<script lang="ts">
    import { t } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ posts, siteConfig } = data);
</script>

<Title value={$t("common.archives")}></Title>
<DescriptionMeta value={$t("common.archives")}></DescriptionMeta>

<svelte:head>
    {#if siteConfig.keywords}
        <meta name="keywords" content={siteConfig.keywords.join(",")} />
    {/if}
    {#if siteConfig.url}
        <link rel="canonical" href="{siteConfig.url}/archives/" />
        <meta property="og:url" content="{siteConfig.url}/archives/" />
    {/if}
</svelte:head>

<div class="container archives">
    <h1>{$t("common.archives")}</h1>

    <PostTimeline {posts} />
</div>

<style>
    .archives {
        display: flex;
        flex-flow: column;
        align-items: center;
    }
</style>
