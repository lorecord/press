<script>
    export let type = "skeleton-line"; // Default type
    export let height = "1em"; // Default height
    export let width = "100%"; // Default width
</script>

<div class="skeleton {type}" style="height: {height}; width: {width};">
    <slot style="visibility: hidden;"></slot>
</div>

<style>
    .skeleton {
        background-color: #e0e0e0;
        border-radius: 4px;
        margin: 8px 0;
        overflow: hidden;
        position: relative;
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
            rgba(255, 255, 255, 0.5) 50%,
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
        height: 3em;
        width: 3em;
        border-radius: 50%;
    }
</style>
