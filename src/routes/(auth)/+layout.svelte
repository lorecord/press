<script lang="ts">
    import "$lib/scss/default.scss";
    import "$lib/scss/dark.scss";
    import "$lib/scss/print.scss";
</script>

<div>
    <slot />
</div>

<style lang="scss">
    div {
        display: flex;
        height: 100svh;
        min-height: 600px;
        align-items: center;
        justify-content: center;
    }
</style>
