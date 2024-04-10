<script lang="ts">
    import { page } from "$app/stores";
</script>

<svelte:head>
    <title>{$page.error?.message || $page.status}</title>
</svelte:head>

<div class="container">
    <h1>{$page.status}</h1>
    <p>{$page.error?.message}</p>
</div>

<style lang="scss">
    .container{
        height: 100%;
        display: flex;
        align-items: center;
        flex-flow: column;
        justify-content: center;
    }
</style>