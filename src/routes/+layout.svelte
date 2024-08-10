<script lang="ts">
    import { afterNavigate } from "$app/navigation";
    import ScrollToTop from "$lib/components/scroll-to-top.svelte";
    import { afterUpdate, onMount } from "svelte";

    export let data: any;
    $: ({ systemConfig } = data);

    function processExternalLinks() {
        let internalDomains = [
            systemConfig.domains.primary,
            document.location.hostname,
        ];
        document.querySelectorAll("a[href]").forEach((link) => {
            const href = link.getAttribute("href");
            if (!href || !/[\w-_+]+:\/\//.test(href)) {
                return;
            }

            const url = href && new URL(href);

            if (
                url &&
                url?.hostname &&
                !internalDomains.includes(url?.hostname)
            ) {
                // add rel="external"
                if (!link.getAttribute("rel")?.includes("external")) {
                    link.setAttribute(
                        "rel",
                        (link.getAttribute("rel") || "") + " external",
                    );
                }
                // 添加 target="_blank"
                if (!link.hasAttribute("target")) {
                    link.setAttribute("target", "_blank");
                }
            }
        });
    }

    onMount(() => {
        processExternalLinks();
    });

    afterUpdate(() => {
        processExternalLinks();
    });

    const scrollToHash = (delay: number = 0) => {
        const hash = window.location.hash;
        if (hash) {
            setTimeout(() => {
                const element = document.getElementById(hash.substring(1));
                if (element) {
                    element.scrollIntoView();
                }
            }, 500);
        }
    };

    onMount(() => {
        if (sessionStorage.getItem("sveltekit:scroll")) {
            scrollToHash(500);
        } else {
            scrollToHash(0);
        }
    });

    afterNavigate(() => {
        scrollToHash(0);
    });
</script>

<svelte:head>
    {#if systemConfig?.domains?.primary}
        {@const primaryDomain = systemConfig?.domains?.primary}
        {@html `
    <style>
        @media screen {
            .article-content a[ref^="external"]::after,
            .article-content a[href^="http"]:not([href*="${primaryDomain}"])::after,
            .comment-body a[href^="http"]:not([href*="${primaryDomain}"])::after,
            .comment-body a[ref^="external"]::after {
                content: "";
                background-color: var(--text-color-tertiary);
                mask: url("data:image/svg+xml; utf8, <svg xmlns='http://www.w3.org/2000/svg' class='icon icon-tabler icon-tabler-external-link' width='40' height='40' viewBox='0 0 24 24' stroke-width='1' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6'></path><path d='M11 13l9 -9'></path><path d='M15 4h5v5'></path></svg>")
                    no-repeat 50% 50%;
                mask-size: cover;
                height: 18px;
                width: 18px;
                display: inline-block;
                vertical-align: sub;
            }
        }
    </style>
    `}
    {/if}

    <script>
        function getColorScheme() {
            const preferScheme = localStorage.getItem("color-scheme");
            if (typeof preferScheme === "string") {
                return preferScheme;
            }

            const mql = window.matchMedia("(prefers-color-scheme: dark)");
            if (typeof mql.matches === "boolean") {
                return mql.matches ? "dark" : "light";
            }
            return light;
        }

        function setColorScheme(scheme) {
            localStorage.setItem("color-scheme", scheme);
            document.documentElement.setAttribute("data-color-scheme", scheme);
        }
    </script>
</svelte:head>

<slot />

<ScrollToTop />
