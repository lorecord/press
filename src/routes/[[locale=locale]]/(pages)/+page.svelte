<script lang="ts">
    import Article from "$lib/components/post/article.svelte";
    import PostCard from "$lib/components/post/card.svelte";
    import { DescriptionMeta, Title } from "$lib/components/seo";
    import { locale, t } from "$lib/translations";
    import Card from "$lib/ui/card/index.svelte";
    import Skeleton from "$lib/ui/skeleton/index.svelte";
    import type { WebPage, WithContext } from "schema-dts";
    import type { PageData } from "./$types";
    import TranslationTips from "$lib/components/translations/tips.svelte";
    import { extendRegionIndepents } from "$lib/utils/html";

    export let data: PageData;

    $: ({
        home,
        posts,
        pathLocale,
        siteConfig,
        systemConfig,
        limit,
        localeContext,
    } = data);

    $: supportedLocales = Array.from(
        new Set([
            systemConfig.locale?.default || "en",
            ...(systemConfig.locale?.supports || []),
        ]),
    );
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
    {#await home then home}
        {#if home?.webmention?.enabled}
            <link
                rel="webmention"
                href={systemConfig.webmention?.endpoint ||
                    `${siteConfig.url}/api/v1/webmention`}
            />
        {/if}

        {#if home?.pingback?.enabled}
            <link
                rel="pingback"
                href={systemConfig.pingback.endpoint ||
                    `${siteConfig.url}/api/v1/pingback`}
            />
        {/if}
    {/await}
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
        {@const url =
            pathLocale && home.lang && (home.langs?.length || 0) > 1
                ? `${siteConfig.url}/${home.lang}/`
                : siteConfig.url}
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />

        {#if (home.langs?.length || 0) > 1}
            <link rel="alternate" href={siteConfig.url} hreflang="x-default" />
            {#each extendRegionIndepents(supportedLocales) as value}
                <link
                    rel="alternate"
                    href="{siteConfig.url}/{value.code}/"
                    hreflang={value.hreflang}
                />
            {/each}
        {/if}
    {/if}

    <meta property="og:locale" content={$locale} />
    {#each supportedLocales as value}
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

    {#await home then home}
        {#if home?.head}
            {@html home.head}
        {/if}

        {#if home?.style}
            <style type="text/css">
            {home.style}
            </style>
        {/if}
        {#if home?.script}
            {@html `<script type="text/javascript">${home.script}</script>`}
        {/if}
    {/await}
</svelte:head>

{#await home}
    <div class="page-wrapper">
        <div class="home container">
            <h1><Skeleton width="18em" /></h1>
            <p><Skeleton width="100%" /></p>
            <p><Skeleton width="33%" /></p>
        </div>
    </div>
{:then home}
    {#if home}
        <div class="page-wrapper">
            <div class="home container">
                <Article
                    post={home}
                    header={false}
                    footer={false}
                    type="none"
                    {siteConfig}
                    {systemConfig}
                />
            </div>
        </div>
        <TranslationTips post={home} {localeContext} />
    {/if}
{/await}

<div class="articles container">
    {#await posts}
        {#each { length: 3 } as _, i}
            <Card tag="article" class="article">
                <svelte:fragment slot="header">
                    <h2><Skeleton width="20em" /></h2>
                </svelte:fragment>
                <svelte:fragment slot="header-extra">
                    <div class="article-meta">
                        <Skeleton width="8em" />
                    </div>
                </svelte:fragment>

                <div class="content">
                    {#if i === 1}
                        <div class="feature_image">
                            <Skeleton width="100%" height="100%" />
                        </div>
                    {/if}
                    <div>
                        {#if i === 2}
                            <div
                                style="color: var(--text-color-tertiary); font-size: 90%"
                            >
                                <span><Skeleton width="4em" /></span>

                                <span><Skeleton width="15em" /></span>

                                <Skeleton width="5em" />
                            </div>
                        {/if}
                        <div class="summary">
                            <p><Skeleton width="100%" /></p>
                            <p><Skeleton width="100%" /></p>
                            <p><Skeleton width="33%" /></p>
                        </div>
                    </div>
                </div>
            </Card>
        {/each}
        <div
            style="display: block;
        text-align: center;"
        >
            <Skeleton height="auto" width="12em"
                ><div style="padding: 1rem;"></div></Skeleton
            >
        </div>
    {:then posts}
        {#each posts as post, index}
            <PostCard {post} showContent={true} />
        {/each}

        {#if posts.length >= limit}
            <div style="display: flex; justify-content: center">
                <a
                    class="button button-text button-pill"
                    href="/archives/"
                    style="color: var(--text-color); padding-left: 3rem; padding-right: 3rem"
                    >{$t("common.find_more")}</a
                >
            </div>
        {/if}
    {/await}
</div>

<style lang="scss">
    .articles {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        padding: 1rem 0;
    }

    .page-wrapper {
        padding: 1rem 0;

        @media print {
            padding: 0;
        }
    }
</style>
