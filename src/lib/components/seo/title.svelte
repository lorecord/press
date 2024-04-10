<script lang="ts">
    export let value: string;
</script>

<svelte:head>
{#if value}
    <title>{value}</title>
    <meta property="og:title" content={value} />
    <meta name="twitter:title" content={value} />
{/if}
</svelte:head>
