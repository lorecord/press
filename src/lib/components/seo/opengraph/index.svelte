<script lang="ts">
    import type { Data } from "../types";
    import { dateToString } from "../index";

    export let data: Data = {};

    $: ({
        title,
        description,
        image,
        video,
        audio,
        author,
        type,
        article,
        locale,
        canonical,
        locales,
        siteConfig,
    } = data);
</script>

<svelte:head>
    {#if canonical}
        <meta property="og:url" content={canonical} />
    {/if}
    {#if type}
        <meta property="og:type" content="article" />
    {:else}
        <meta property="og:type" content="website" />
    {/if}
    {#if title}
        <meta property="og:title" content={title} />
    {/if}
    {#if description}
        <meta property="og:description" content={description} />
    {/if}
    {#if image}
        {#each [image].flat() as img}
            {#if typeof img === "string"}
                <meta property="og:image" content={img} />
            {:else}
                {#if img.url}
                    <meta property="og:image" content={img.url} />
                {/if}
                {#if img.alt}
                    <meta property="og:image:alt" content={img.alt} />
                {/if}
                {#if img.width}
                    <meta
                        property="og:image:width"
                        content={img.width.toString()}
                    />
                {/if}
                {#if img.height}
                    <meta
                        property="og:image:height"
                        content={img.height.toString()}
                    />
                {/if}
                {#if img.secure_url}
                    <meta
                        property="og:image:secure_url"
                        content={img.secure_url}
                    />
                {/if}
                {#if img.type}
                    <meta property="og:image:type" content={img.type} />
                {/if}
            {/if}
        {/each}
    {/if}
    {#if video}
        <meta property="og:video" content={video} />
    {/if}

    {#if audio}
        <meta property="og:audio" content={audio} />
    {/if}
    {#if article}
        {#if author}
            <meta
                property="og:article:author"
                content={[author]
                    .flat()
                    .map((author) => author.name)
                    .join(",")}
            />
        {/if}
        {#if article.published_time}
            <meta
                name="og:article:published_time"
                content={dateToString(article.published_time)}
            />
        {/if}
        {#if article.modified_time}
            <meta
                name="og:article:modified_time"
                content={dateToString(article.modified_time)}
            />
        {/if}
        {#if article.sections?.length}
            <meta property="og:article:section" content={article.sections[0]} />
        {/if}
        {#if article.tags?.length}
            {#each article.tags as tag}
                <meta property="og:article:tag" content={tag} />
            {/each}
        {/if}
    {/if}
    {#if locale}
        <meta property="og:locale" content={locale} />
    {/if}
    {#if locales}
        {#each locales as loc}
            <meta property="og:locale:alternate" content={loc.lang} />
        {/each}
    {/if}
    {#if siteConfig?.name}
        <meta property="og:site_name" content={siteConfig.name} />
    {/if}
</svelte:head>
