<script lang="ts">
    import type { Data } from "../types";

    export let data: Data = {};

    $: ({ title, description, image, video, audio, twitter, site, app } = data);
</script>

<svelte:head>
    {#if video || audio}
        <meta name="twitter:card" content="player" />
    {:else if image}
        <meta name="twitter:card" content="summary_large_image" />
    {:else if app}
        <meta name="twitter:card" content="app" />
    {:else}
        <meta name="twitter:card" content="summary" />
    {/if}

    {#if title}
        <meta name="twitter:title" content={title} />
    {/if}
    {#if description}
        <meta name="twitter:description" content={description} />
    {/if}
    {#if image}
        {#each [image].flat() as img}
            {#if typeof img === "string"}
                <meta name="twitter:image" content={img} />
            {:else if img.url}
                <meta name="twitter:image" content={img.url} />
            {/if}
        {/each}
    {/if}
    {#if twitter?.creator}
        <meta name="twitter:creator" content={twitter?.creator} />
    {/if}
    {#if twitter?.site}
        <meta name="twitter:site" content={twitter?.site || site?.name} />
    {/if}
</svelte:head>
