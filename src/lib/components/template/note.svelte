<script lang="ts">
    import Article from "$lib/components/post/article.svelte";

    export let post: any;
    export let systemConfig: any;
    export let siteConfig: any;

    $: ({ title, summary_html, url, date, image, review } = post);
</script>

<Article {post} {systemConfig} {siteConfig} />
