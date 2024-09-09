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

    $: ({ category, posts, siteConfig, localeContext, systemConfig } = data);

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

    $: supportedLocales = Array.from(
        new Set([
            systemConfig.locale?.default || "en",
            ...(systemConfig.locale?.supports || []),
        ]),
    );
</script>

{#await label}
    <Title value={`${$t("common.category")}: ${category}`}></Title>
{:then label}
    <Title value={`${$t("common.category")}: ${label}`}></Title>
    <DescriptionMeta value={`${$t("common.category")}: ${label}`}
    ></DescriptionMeta>
{/await}

<svelte:head>
    {#if localeContext.contentLang}
        <meta
            http-equiv="Content-Language"
            content={localeContext.contentLang}
        />
    {/if}

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
            supportedLocales.length > 1 && localeContext.pathLocale
                ? `${siteConfig.url}/${localeContext.pathLocale}/category/${category}/`
                : `${siteConfig.url}/category/${category}/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        {#if supportedLocales.length > 1}
            <link
                rel="alternate"
                href={`${siteConfig.url}/category/${category}/`}
                hreflang="x-default"
            />
            {#each extendRegionIndepents(supportedLocales) as value}
                <link
                    rel="alternate"
                    href="{siteConfig.url}/{value.code}/category/{category}/"
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
        <h1>{$t("common.category")}: {label}</h1>
    {/await}

    {#await posts}
        <h3><Skeleton width="18em" /></h3>
        <h3><Skeleton width="13em" /></h3>
        <h3><Skeleton width="16em" /></h3>
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
