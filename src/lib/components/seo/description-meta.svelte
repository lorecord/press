<script lang="ts">
    export let value: string;
</script>

<svelte:head>
{#if value}
    <meta name="description" content={value} />
    <meta name="twitter:description" content={value} />
    <meta name="og:description" content={value} />
{/if}
</svelte:head>
