<script lang="ts">
    import type { Data } from "../types";

    export let data: Data = {};

    function flatJoin(
        arr: string[] | string,
        separator: string | undefined = ",",
    ) {
        return [arr].flat().join(separator);
    }

    $: ({
        title,
        description,
        keywords,
        author,
        article,
        robots,
        googlebot,
        google,
        rating,
        canonical,
        locales,
        issn,
    } = data);
</script>

<svelte:head>
    {#if title}
        <title>{title}</title>
    {/if}
    {#if description}
        <meta name="description" content={description} />
    {/if}
    {#if article?.sections || article?.tags || keywords}
        <meta
            name="keywords"
            content={`${[article?.sections, article?.tags, keywords]
                .filter((s) => !!s)
                .flat()
                .join(",")}`}
        />
    {/if}
    {#if author}
        <meta
            name="author"
            content={[author]
                .flat()
                .map((author) => author.name || author.account || author)
                .join(",")}
        />
    {/if}
    {#if robots}
        <meta name="robots" content={flatJoin(robots, ",")} />
    {/if}
    {#if googlebot}
        <meta name="googlebot" content={googlebot} />
    {/if}
    {#if googlebot}
        <meta name="google" content={google} />
    {/if}
    {#if rating}
        <meta name="rating" content={rating} />
    {/if}
    {#if canonical}
        <link rel="canonical" href={canonical} />
        <link rel="alternate" href={canonical} hreflang="x-default" />
    {/if}
    {#if locales}
        {#each locales as loc}
            <link rel="alternate" href={loc.url} hreflang={loc.lang} />
        {/each}
    {/if}
    {#if issn}
        <meta name="citation_issn" content={issn} />
    {/if}
</svelte:head>
