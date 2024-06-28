<script lang="ts">
    import { trancateText } from "../post/utils";

    export let value: string | undefined = undefined;

    $: trancated = trancateText(value);
</script>

<svelte:head>
    {#if trancated}
        <meta name="description" content={trancated} />
        <meta name="twitter:description" content={trancated} />
        <meta name="og:description" content={trancated} />
    {/if}
</svelte:head>
