<script lang="ts">
    import { dev } from "$app/environment";
    import Header from "$lib/components/header.svelte";
    import Footer from "$lib/components/footer.svelte";
    import LoadingBar from "$lib/components/loading-bar.svelte";
    import { fade } from "svelte/transition";
    import { page, navigating } from "$app/stores";
    import { t, locales, locale } from "$lib/translations";
    import { onMount } from "svelte";

    import "../../styles.css";

    import "$lib/scss/default.scss";
    import "$lib/scss/dark.scss";
    import "$lib/scss/print.scss";

    /** @type {import('./$types').PageData} */
    export let data: any;

    let loadingBar: LoadingBar;

    $: ({ posts, systemConfig, siteConfig, currentRoute } = data);
    $: ({ seo } = $page.data);

    onMount(() => {
        loadingBar?.finish();

        const unsubscribeNavigating = navigating.subscribe((nav) => {
            if (nav?.to) {
                loadingBar?.start();
            } else {
                loadingBar?.finish();
            }
        });

        return () => {
            unsubscribeNavigating();
            loadingBar?.start();
        };
    });
</script>

<svelte:window
    on:sveltekit:navigation-start={() => loadingBar?.update(20)}
    on:sveltekit:navigation-end={() => loadingBar?.finish()}
/>

<svelte:head>
    <meta property="og:site_name" content={siteConfig.title} />

    {#if siteConfig.issn}
        <meta name="citation_issn" content={siteConfig.issn} />
    {/if}

    <meta name="twitter:card" content="summary" />

    {#if siteConfig["x.com"]?.username}
        <meta name="twitter:site" content={siteConfig["x.com"].username} />
        <meta name="twitter:creator" content={systemConfig.user?.default} />
    {/if}

    <link
        rel="alternate"
        type="application/rss+xml"
        title="RSS Feed for {siteConfig.title}"
        href="/feed/"
    />

    <meta property="og:locale" content={$locale} />
    {#each $locales as value}
        {#if value !== $locale}
            <meta property="og:locale:alternate" content={value} />
        {/if}

        <link
            rel="alternate"
            type="application/rss+xml"
            title="RSS Feed for {siteConfig.title} ({$t(`lang.${value}`)})"
            href={`/${value}/feed/`}
        />
    {/each}

    {#if !dev}
        {#if systemConfig.domains?.primary && systemConfig.plausible?.enabled && systemConfig.plausible?.domain}
            <script
                defer
                data-domain={systemConfig.domains?.primary}
                src={`//${systemConfig.plausible?.domain}/js/script.js`}
            ></script>
        {/if}
        {#if systemConfig.clarity?.enabled && systemConfig.clarity?.project}
            {@html `<script type="text/javascript">
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${systemConfig.clarity?.project}");
            </script>`}
        {/if}
    {/if}

    <meta name="theme-color" content="#111" />

    <script>
        window.addEventListener =
            window.addEventListener ||
            function (event, listener) {
                window.attachEvent("on" + event, listener);
            } ||
            function (event, listener) {
                window["on" + event] = window["on" + event]
                    ? () => {
                          window["on" + event]();
                          listener();
                      }
                    : listener;
            };

        window.whenLoad = function (listener) {
            if (document.readyState === "complete") {
                listener();
            } else {
                window.addEventListener("load", listener);
            }
        };

        window.once = function (runnable) {
            var fired = false;
            return function () {
                if (!fired) {
                    fired = true;
                    runnable.apply(this, arguments);
                }
            };
        };

        window.single = function (runnable) {
            var success = false;
            return function () {
                if (success) {
                    return;
                }
                success = runnable.apply(this, arguments);
            };
        };
    </script>

    {#if siteConfig.adsense?.enabled}
        {#if siteConfig.adsense?.async}
            {@html `
            <script>
                (()=>{
                    let ref = document.referrer;
                    let fromSearch = /(google|baidu|bing)\./i.test(ref);
                    if(!fromSearch){
                        return;
                    }
                    function loadAd() {
                        var e = document.createElement("script");
                        e.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsense.client}";
                        e.async = true;
                        e.setAttribute('crossorigin', 'anonymous');
                        document.body.appendChild(e);
                    }
                    window.addEventListener("load", loadAd, false);
                })();
            </script>
            `}
        {:else}
            {@html `
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsense.client}" crossorigin="anonymous"></script>
            `}
        {/if}
    {/if}
</svelte:head>

<div class="layout">
    <LoadingBar bind:this={loadingBar} />
    <Header
        {posts}
        {siteConfig}
        gravatarBase={systemConfig.gravatar?.base}
        isHome={currentRoute === "/"}
    />
    <main class="trunk">
        {#key currentRoute}
            <div
                class="fluid-container"
                in:fade|global={{ duration: 150, delay: 150 }}
                out:fade|global={{ duration: 150 }}
            >
                <slot />
            </div>
        {/key}
    </main>
    <Footer {posts} {siteConfig} />
</div>

<style lang="scss">
    .layout {
        display: flex;
        flex-direction: column;
        min-height: 100svh;
    }

    .trunk {
        flex: 1;
        display: flex;
        flex-flow: column;
    }

    .fluid-container {
        flex: 1;
    }
</style>
