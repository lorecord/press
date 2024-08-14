<script lang="ts">
    import Article from "../post/article.svelte";
    import Micro from "../post/micro.svelte";

    export let post: any;
    export let systemConfig: any;
    export let siteConfig: any;

    $: ({ title, summary_html, url, date, image, review } = post);
</script>

{#if title}
    <Article {post} {systemConfig} {siteConfig} />
{:else}
    <Micro {post} {systemConfig} {siteConfig} />
{/if}
