<script lang="ts">
    import { t, locale, locales } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import type { WebPage, WithContext } from "schema-dts";
    import { browser } from "$app/environment";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ series, posts, siteConfig, pathLocale } = data);

    const resolveLabel = (posts: any[]) =>
        posts?.length
            ? posts[0].taxonomy?.series?.find(
                  (t: string) =>
                      t.toLowerCase().replace(/\s+/gm, "-") ===
                      series.toLowerCase().replace(/\s+/gm, "-"),
              )
            : series;
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

{#await posts then posts}
    <Title value={`${$t("common.series")}: ${label}`}></Title>
    <DescriptionMeta value={`${$t("common.series")}: ${label}`}
    ></DescriptionMeta>
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
        {@const url = `${siteConfig.url}/${pathLocale || $locale}/series/${series}/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        <link
            rel="alternate"
            href={`${siteConfig.url}/series/${series}/`}
            hreflang="x-default"
        />
        {#each $locales as value}
            <link
                rel="alternate"
                href="{siteConfig.url}/{value}/series/{series}/"
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
    {#await label then label}
        <h1>{$t("common.series")}: {label}</h1>
    {/await}
    {#await posts}
        <p>Loading...</p>
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
