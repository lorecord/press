<script lang="ts">
    import { t, locales, locale } from "$lib/translations";
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import type { WebPage, WithContext } from "schema-dts";
    import { browser } from "$app/environment";
    import Skeleton from "$lib/ui/skeleton/index.svelte";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ category, posts, siteConfig, pathLocale } = data);

    const resolveLabel = (posts: any[]) =>
        posts?.length
            ? posts[0].taxonomy?.category?.find(
                  (c: string) =>
                      c.toLowerCase().replace(/\s+/gm, "-") ===
                      category.toLowerCase().replace(/\s+/gm, "-"),
              )
            : category;
    $: label = browser
        ? Promise.resolve(posts).then(resolveLabel)
        : resolveLabel(posts);

    $: ldjson = () => {
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

{#await label then label}
    <Title value={`${$t("common.category")}: ${label}`}></Title>
    <DescriptionMeta value={`${$t("common.category")}: ${label}`}
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
        {@const url = `${siteConfig.url}/${pathLocale || $locale}/category/${category}/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        <link
            rel="alternate"
            href={`${siteConfig.url}/category/${category}/`}
            hreflang="x-default"
        />
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

    {@html `<script type="application/ld+json">${JSON.stringify(
        ldjson(),
    )}</script>`}
</svelte:head>

<div class="container archives">
    {#await label}
        <Skeleton width="50%" />
    {:then label}
        <h1>{$t("common.category")}: {label}</h1>
    {/await}

    {#await posts}
        <Skeleton width="33%" />
        <Skeleton width="33%" />
    {:then value}
        <PostTimeline posts={value} />
    {/await}
</div>

<style>
    .archives {
        display: flex;
        flex-flow: column;
        align-items: center;
    }
</style>
