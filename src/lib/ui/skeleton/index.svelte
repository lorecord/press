<script>
    export let type = "line"; // Default type
    export let height = "1em"; // Default height
    export let width = "100%"; // Default width
</script>

<div class="skeleton skeleton-{type}" style="height: {height}; width: {width}; ">
    <slot style="visibility: hidden;"></slot>
</div>

<style lang="scss">
    .skeleton {
        background-color: rgb(222, 222, 222);
        border-radius: 0.25rem;
        margin: 0.5rem 0;
        overflow: hidden;
        position: relative;
        display: inline-block;

        @media (prefers-color-scheme: dark) {
            background-color: rgb(55, 55, 55);
        }
    }
    .skeleton::after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        animation: loading 1.5s infinite;
    }
    @keyframes loading {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }
    .skeleton-line {
        height: 1em;
    }
    .skeleton-avatar {
        height: 3em !important;
        width: 3em !important;
        border-radius: 50%;
    }
</style>
