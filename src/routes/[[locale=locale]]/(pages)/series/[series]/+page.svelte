<script lang="ts">
    import { browser } from "$app/environment";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { DescriptionMeta, Title } from "$lib/components/seo";
    import { locale, t } from "$lib/translations";
    import Skeleton from "$lib/ui/skeleton/index.svelte";
    import type { WebPage, WithContext } from "schema-dts";
    import type { PageData } from "./$types";
    import { extendRegionIndepents } from "$lib/utils/html";

    export let data: PageData;

    $: ({ series, posts, siteConfig, pathLocale, systemConfig } = data);

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

    $: supportedLocales = Array.from(
        new Set([
            systemConfig.locale?.default || "en",
            ...(systemConfig.locale?.supports || []),
        ]),
    );
</script>

{#await label}
    <Title value={`${$t("common.series")}: ${series}`}></Title>
{:then label}
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
        {@const url =
            supportedLocales.length > 1 && pathLocale
                ? `${siteConfig.url}/${pathLocale}/series/${series}/`
                : `${siteConfig.url}/series/${series}/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        {#if supportedLocales.length > 1}
            <link
                rel="alternate"
                href={`${siteConfig.url}/series/${series}/`}
                hreflang="x-default"
            />
            {#each extendRegionIndepents(supportedLocales) as value}
                <link
                    rel="alternate"
                    href="{siteConfig.url}/{value.code}/series/{series}/"
                    hreflang={value.hreflang}
                />
            {/each}
        {/if}
    {/if}

    <meta property="og:type" content="website" />

    <meta property="og:locale" content={$locale} />
    {#each supportedLocales as value}
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
        <h1><Skeleton width="12em" /></h1>
    {:then label}
        <h1>{$t("common.series")}: {label}</h1>
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
