<script lang="ts">
    export let style: any = {};
    export let tag = "div";

    let clazz = "";
    export { clazz as class };

    const formatToHTMLStyleFromObject = (styleObj: any) => {
        if (typeof styleObj === "string") {
            return styleObj;
        }
        return Object.entries(style).reduce(
            (acc, [key, value]) => `${acc} ${key}: ${value};`,
            "",
        );
    };

    $: styleHTML = formatToHTMLStyleFromObject(style);
</script>

<svelte:element this={tag} class={`card ${clazz}`} style={styleHTML}>
    {#if $$slots.header}
        <div class="header">
            <slot name="header" />
            <slot name="header-extra" />
        </div>
    {/if}
    {#if $$slots.default}
        <div class="body">
            <slot />
        </div>
    {/if}
    {#if $$slots.footer}
        <div class="footer">
            <slot name="footer" />
        </div>
    {/if}
</svelte:element>

<style lang="scss">
    .card {
        --card-bg-color: var(--content-bg-color);
        --card-border: var(--content-border);

        background: var(--card-bg-color);
        border: var(--card-border);
        border-radius: var(--content-border-radius);
        padding: 0rem var(--content-padding);
    }

    @media (prefers-color-scheme: dark) {
        .card {
        }
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
    }

    :global(.card .header > *) {
        margin-top: 0;
    }

    @media screen and (max-width: 600px) {
        .header {
            flex-flow: column;
            gap: 1rem;
            align-items: unset;
        }
    }
</style>
