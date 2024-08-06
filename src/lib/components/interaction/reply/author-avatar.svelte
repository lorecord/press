<script lang="ts">
    export let avatar: string = "";
    export let gravatarBase: string = "//gravatar.com";
    export let hash: string = "";
    export let alt: string = "";
    export let size: number = 48;

    $: src = avatar || `${gravatarBase}/avatar/${hash}?s=${size}&d=retro`;
</script>

<img class="avatar rounded-circle" {src} {alt} />

<style lang="scss">
    img {
        border: var(--border-size) solid var(--bg-color);
        border-radius: 50%;
        width: calc(var(--avatar-size));
        height: calc(var(--avatar-size));
        background: var(--text-color-quinary);
        object-fit: cover;
    }
</style>
