<script lang="ts">
    import { t, locale, locales } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import type { WebPage, WithContext } from "schema-dts";
    import Skeleton from "$lib/ui/skeleton/index.svelte";
    import { browser } from "$app/environment";
    import type { PageData } from "./$types";

    export let data: PageData;

    $: ({ tag, posts, siteConfig, pathLocale } = data);

    const resolveLabel = (posts: any[]) =>
        posts?.length
            ? posts[0].taxonomy?.tag?.find(
                  (t: string) =>
                      t.toLowerCase().replace(/\s+/gm, "-") ===
                      tag.toLowerCase().replace(/\s+/gm, "-"),
              )
            : tag;
    $: label = browser
        ? Promise.resolve(posts).then(resolveLabel)
        : resolveLabel(posts);

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

{#await label}
    <Title value={`${$t("common.tag")}: ${tag}`}></Title>
{:then label}
    <Title value={`${$t("common.tag")}: ${label}`}></Title>
    <DescriptionMeta value={`${$t("common.tag")}: ${label}`}></DescriptionMeta>
{/await}

<svelte:head>
    {#await label then label}
        {#if siteConfig.keywords}
            <meta
                name="keywords"
                content={`${label},${siteConfig.keywords.join(",")}`}
            />
        {:else}
            <meta name="keywords" content={`${label}`} />
        {/if}
    {/await}

    {#if siteConfig.url}
        {@const url = `${siteConfig.url}/${pathLocale || $locale}/tag/${tag}/`}
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
    {#await label}
        <h1><Skeleton width="10em" /></h1>
    {:then label}
        <h1>{$t("common.tag")}: {label}</h1>
    {/await}
    {#await posts}
        <h3><Skeleton width="18em" /></h3>
        <h3><Skeleton width="13em" /></h3>
        <h3><Skeleton width="16em" /></h3>
    {:then posts}
        <PostTimeline {posts} />
    {/await}
</div>

<style>
    .archives {
        display: flex;
        flex-flow: column;
        align-items: center;
    }
</style>
