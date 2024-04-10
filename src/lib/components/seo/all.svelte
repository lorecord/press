<script lang="ts">
    import type { Data } from "./types";
    import Html from "./html/index.svelte";
    import OpenGraph from "./opengraph/index.svelte";
    import TwitterCard from "./twittercard/index.svelte";
    import LdJson from "./ldjson/index.svelte";

    export let data: Data = {};

    export let og: boolean = true;
    export let card: boolean = true;
    export let ld: boolean = true;
</script>

<Html {data} />

{#if og}
    <OpenGraph {data} />
{/if}
{#if card}
    <TwitterCard {data} />
{/if}
{#if ld}
    <LdJson {data} />
{/if}
