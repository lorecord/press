<script>
    import { browser } from "$app/environment";
    import { IconRocket } from "@tabler/icons-svelte";

    let isVisible = false;

    if (browser) {
        window.addEventListener("scroll", () => {
            isVisible = window.scrollY > 300;
        });
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<button
    class="button button-square button-pill button-3 scroll-to-top"
    on:click={scrollToTop}
    class:visible={isVisible}
>
    <IconRocket size={20} />
</button>

<style>
    .scroll-to-top {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        opacity: 0;
        transition:
            opacity 0.2s,
            transform 0.2s;
        z-index: 1000;
    }

    .scroll-to-top.visible {
        opacity: 1;
    }
</style>
