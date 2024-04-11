<script lang="ts">
    import PostCard from "$lib/components/post/card.svelte";
    import { locales, t } from "$lib/translations";
    import { Title, DescriptionMeta } from "$lib/components/seo";

    /** @type {import('./$types').PageData} */
    export let data: any;

    $: ({ posts, siteConfig, ldjson, systemConfig } = data);

    let json = () => {
        let sameAs: string[] = [];
        if (siteConfig["x.com"]?.username) {
            sameAs.push(`https://x.com/${siteConfig["x.com"].username}`);
        }
        if (siteConfig.github?.home) {
            sameAs.push(`https://github.com/${siteConfig.github.home}`);
        }
        let obj: any = {
            "@context": "https://schema.org",
            "@type": "Website",
            name: siteConfig.title,
            url: `${siteConfig.url}`,
            logo: `${siteConfig.url}/favicon.png`,
            sameAs,
        };

        return Object.assign({}, ldjson, obj);
    };
</script>

<Title value={siteConfig.title}></Title>
{#if siteConfig.description}
    <DescriptionMeta value={siteConfig.description}></DescriptionMeta>
{/if}

<svelte:head>
    {#if systemConfig.activitypub?.enabled}
        <link
            rel="alternate"
            type="application/activity+json"
            href="/.well-known/nodeinfo"
        />
        <meta
            name="admin"
            content="mailto:admin@{systemConfig.domain?.primary}"
        />
    {/if}
    {#if siteConfig.keywords}
        <meta name="keywords" content={siteConfig.keywords.join(",")} />
    {/if}
    {#if siteConfig.url}
        <link rel="canonical" href={siteConfig.url} />
        <meta property="og:url" content={siteConfig.url} />
    {/if}

    <meta property="og:type" content="website" />

    <link rel="alternate" href={siteConfig.url} hreflang="x-default" />
    {#each $locales as value}
        <link
            rel="alternate"
            href="{siteConfig.url}/{value}/"
            hreflang={value}
        />
    {/each}

    {@html `<script type="application/ld+json">${JSON.stringify(
        json(),
    )}</script>`}

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
            <link
                href={`https://twitter.com/${siteConfig["x.com"].username}`}
                rel="me"
            />
        {/if}
    {/if}
</svelte:head>

<div class="articles container">
    {#each posts as post, index}
        <PostCard {post} showContent={index == 0} />
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
