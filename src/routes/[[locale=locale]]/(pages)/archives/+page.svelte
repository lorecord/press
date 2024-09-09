<script lang="ts">
    import PostTimeline from "$lib/components/post/timeline.svelte";
    import { DescriptionMeta, Title } from "$lib/components/seo";
    import { locale, t } from "$lib/translations";
    import Skeleton from "$lib/ui/skeleton/index.svelte";
    import type { WebPage, WithContext } from "schema-dts";
    import type { PageData } from "./$types";
    import { extendRegionIndepents } from "$lib/utils/html";

    export let data: PageData;

    $: ({ posts, siteConfig, localeContext, systemConfig } = data);

    let ldjson = () => {
        let creativeWork: WebPage = {
            "@type": "WebPage",
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

<Title value={$t("common.archives")}></Title>
<DescriptionMeta value={$t("common.archives")}></DescriptionMeta>

<svelte:head>
    {#if siteConfig.keywords}
        <meta name="keywords" content={siteConfig.keywords.join(",")} />
    {/if}

    {#if localeContext.contentLang}
        <meta
            http-equiv="Content-Language"
            content={localeContext.contentLang}
        />
    {/if}

    {#if siteConfig.url}
        {@const url =
            supportedLocales.length > 1 && localeContext.pathLocale
                ? `${siteConfig.url}/${localeContext.pathLocale}/archives/`
                : `${siteConfig.url}/archives/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        {#if supportedLocales.length > 1}
            <link
                rel="alternate"
                href={`${siteConfig.url}/archives/`}
                hreflang="x-default"
            />

            {#each extendRegionIndepents(supportedLocales) as value}
                <link
                    rel="alternate"
                    href="{siteConfig.url}/{value.code}/archives/"
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
    <h1>{$t("common.archives")}</h1>

    {#await posts}
        <h3><Skeleton width="18em" /></h3>
        <h3><Skeleton width="13em" /></h3>
        <h3><Skeleton width="16em" /></h3>
    {:then value}
        <PostTimeline posts={value} />
    {/await}
</div>

<style lang="scss">
    .archives {
        display: flex;
        flex-flow: column;
        align-items: center;
    }
</style>
