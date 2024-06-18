<script lang="ts">
    import PostCard from "$lib/components/post/card.svelte";
    import { locales, t, locale } from "$lib/translations";
    import { Title, DescriptionMeta } from "$lib/components/seo";
    import type { WebPage, WithContext } from "schema-dts";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ posts, pathLocale, siteConfig, systemConfig } = data);

    let ldjson = () => {
        let creativeWork: WebPage = {
            "@type": "WebPage",
        };

        let schema: WithContext<any> = Object.assign(creativeWork, {
            "@context": "https://schema.org",
        });

        return schema;
    };
</script>

<Title value={siteConfig.title}></Title>
<DescriptionMeta value={siteConfig.description}></DescriptionMeta>

<svelte:head>
    {#if systemConfig.git?.repo}
        <link rel="vcs-git" href={systemConfig.git?.repo} />
    {/if}
    {#if systemConfig.openid?.server}
        <link rel="openid.server" href={systemConfig.openid?.server} />
        <link rel="openid.delegate" href={systemConfig.openid?.delegate} />
    {/if}
    {#if systemConfig.openid2?.provider}
        <link rel="openid2.provider" href={systemConfig.openid?.provider} />
        <link rel="openid2.local_id" href={systemConfig.openid2?.local_id} />
        <meta
            http-equiv="X-XRDS-Location"
            content={systemConfig.openid2["X-XRDS-Location"]}
        />
    {/if}
    {#if siteConfig.keywords}
        <meta name="keywords" content={siteConfig.keywords.join(",")} />
    {/if}
    {#if siteConfig.url}
        {@const url = `${siteConfig.url}/${pathLocale || $locale}/`}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        <link rel="alternate" href={siteConfig.url} hreflang="x-default" />
        {#each $locales as value}
            <link
                rel="alternate"
                href="{siteConfig.url}/{value}/"
                hreflang={value}
            />
        {/each}
    {/if}

    <meta property="og:locale" content={$locale} />
    {#each $locales as value}
        {#if value !== $locale}
            <meta property="og:locale:alternate" content={value} />
        {/if}
    {/each}

    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary" />

    {#if systemConfig.brand?.personal}
        {#if siteConfig.github?.username}
            <link
                href={`https://github.com/${siteConfig.github.username}`}
                rel="me"
            />
        {/if}
        {#if siteConfig["x.com"]?.username}
            <link
                href={`https://x.com/${siteConfig["x.com"].username}`}
                rel="me"
            />
        {/if}
    {/if}

    {@html `<script type="application/ld+json">${JSON.stringify(
        ldjson(),
    )}</script>`}
</svelte:head>

<div class="articles container">
    {#each posts as post, index}
        <PostCard {post} showContent={true} />
    {/each}

    <a
        href="/archives/"
        style="display: block;
    text-align: center;
    padding: 1rem;
    color: var(--text-color);">{$t("common.find_more")}</a
    >
</div>

<style lang="scss">
    .articles {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        padding: 1rem 0;
    }
</style>
