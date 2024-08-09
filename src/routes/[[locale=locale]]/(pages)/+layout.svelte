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
    import type { WebSite, WithContext } from "schema-dts";
    import type { PageData } from "./$types";

    export let data: PageData;

    let loadingBar: LoadingBar;

    $: ({ posts, systemConfig, siteConfig, currentRoute, session } = data);
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

    let ldjson = () => {
        let sameAs: string[] = [];
        if (siteConfig["x.com"]?.username) {
            sameAs.push(`https://x.com/${siteConfig["x.com"].username}`);
        }
        if (siteConfig.github?.home) {
            sameAs.push(`https://github.com/${siteConfig.github.username}`);
        }
        let website: WebSite = {
            "@type": "WebSite",
            name: siteConfig.title,
            url: `${siteConfig.url}`,
            image: `${siteConfig.url}/favicon.png`,
            sameAs,
        };

        if (siteConfig.issn) {
            website.issn = siteConfig.issn;
        }

        let schema: WithContext<any> = Object.assign(website, {
            "@context": "https://schema.org",
        });

        return schema;
    };
</script>

<svelte:window
    on:sveltekit:navigation-start={() => loadingBar?.update(20)}
    on:sveltekit:navigation-end={() => loadingBar?.finish()}
/>

<svelte:head>
    <meta name="referrer" content="no-referrer-when-downgrade" />
    <meta name="generator" content="LorePress 0.0.1-alpha" />
    <meta property="og:site_name" content={siteConfig.title} />

    {#if siteConfig.issn}
        <meta name="citation_issn" content={siteConfig.issn} />
    {/if}

    {#if siteConfig["x.com"]?.username}
        <meta name="twitter:site" content={siteConfig["x.com"].username} />
        <meta name="twitter:creator" content={systemConfig.user?.default} />
    {/if}

    <link
        rel="alternate"
        type="application/rss+xml"
        title="{siteConfig.title}"
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
            title="{siteConfig.title} ({$t(`lang.${value}`)})"
            href={`/${value}/feed/`}
        />
    {/each}

    {#if !dev}
        {#if !session && systemConfig.domains?.primary && systemConfig.plausible?.enabled && systemConfig.plausible?.domain}
            <script
                defer
                data-domain={systemConfig.domains?.primary}
                src={`//${systemConfig.plausible?.domain}/js/script.js`}
            ></script>
        {/if}
        {#if !session && systemConfig.clarity?.enabled && systemConfig.clarity?.project}
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

    {#if systemConfig.webmention?.enabled && systemConfig.domains?.primary}
        <link
            rel="webmention"
            href={`https://webmention.io/${systemConfig.domains?.primary}/webmention`}
        />

        {#if systemConfig.webmention?.pingback}
            <link
                rel="pingback"
                href={`https://webmention.io/${systemConfig.domains?.primary}/xmlrpc`}
            />
        {/if}
    {/if}

    {@html `<script type="application/ld+json">${JSON.stringify(
        ldjson(),
    )}</script>`}

    <link href="/assets/spacer/spacer.min.css" rel="stylesheet" />
    <script async src="/assets/spacer/spacer.js?v=20240729"></script>
    <script>
        (() => {
            let spacer = { spacePace: () => {} };
            let options = {
                // wrapper: {
                //     open: "<spacer>",
                //     close: "</spacer>",
                // },
                spacingContent: " ",
                handleOriginalSpace: true,
                forceUnifiedSpacing: true,
            };
            let observeSpacer = once(() => {
                var observer = new MutationObserver(function (mutations) {
                    observer.disconnect();
                    if (mutations && mutations.length > 0) {
                        mutations.forEach((m) => {
                            if (m.type === "childList") {
                                spacer.spacePage(m.addedNodes, {}, false);
                            } else if (m.type === "characterData") {
                                spacer.spacePage(m.target.parent || m.target, {}, false);
                            }
                        });
                    }
                    connect();
                });

                var config = {
                    characterData: true,
                    childList: true,
                    attributes: true,
                    subtree: true,
                };
                function connect() {
                    observer.observe(document, config);
                }
                connect();
            });

            let initSpacer = once(() => {
                spacer = new Spacer(options);
                spacer.spacePage(document);
            });

            let startSpacer = once(() => {
                initSpacer();
                observeSpacer();
                return true;
            });

            window.whenLoad(handleSpacer);

            function handleSpacer() {
                if (window.Spacer) {
                    startSpacer();
                } else {
                    setTimeout(handleSpacer, 100);
                }
            }

            document.addEventListener("DOMContentLoaded", handleSpacer, false);
        })();
    </script>
</svelte:head>

<div class="layout" lang={$locale}>
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
        min-width: 300px;
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
