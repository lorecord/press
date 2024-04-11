<script lang="ts">
    import { t } from "$lib/translations";
    import { IconMenu, IconX } from "@tabler/icons-svelte";

    export let posts: any[];
    export let gravatarBase: string;
    export let siteConfig: any;
    export let isHome: boolean = false;

    let reponsive = false;

    const handleReponsive = () => {
        reponsive = !reponsive;
    };
    const handleBlur = () => {
        reponsive = false;
    };
    const handleClick = () => {
        reponsive = false;
    };
</script>

<header class="no-print">
    <nav class="navbar" class:reponsive on:blur={handleBlur}>
        <div class="container">
            <a class="navbar-brand" href="/">
                {#if siteConfig?.logo?.provider === "gravatar" && siteConfig.logo.gravatar}
                    <img
                        class="avatar brand-icon u-photo"
                        src={`${gravatarBase}/avatar/${siteConfig.logo.gravatar}?s=48`}
                        alt={siteConfig?.title || "Press"}
                    />
                {:else if siteConfig?.logo?.provider === "local" && siteConfig.logo.local}
                    <img
                        class="avatar brand-icon  u-photo"
                        src={siteConfig.logo.local}
                        alt={siteConfig?.title || "Press"}
                    />
                {/if}
                <svelte:element this={isHome ? "h1" : "span"} class="brand-text"
                    >{siteConfig?.title || "Press"}</svelte:element
                >
            </a>
            <ul class="nav">
                <li class="nav-item">
                    <a href="/" class="nav-link active" on:click={handleClick}
                        >{$t("common.home")}</a
                    >
                </li>
                <li class="nav-item">
                    <a href="/archives/" class="nav-link" on:click={handleClick}
                        >{$t("common.archives")}</a
                    >
                </li>
                {#each posts as p}
                    {#if p.menu?.header}
                        <li class="nav-item">
                            <a
                                href={p.url}
                                class="nav-link"
                                on:click={handleClick}
                                >{p.menu.label || p.title}</a
                            >
                        </li>
                    {/if}
                {/each}
            </ul>

            <div class="sm">
                <button id="button" class="text" on:click={handleReponsive}>
                    {#if reponsive}
                        <IconX size={18} />
                    {:else}
                        <IconMenu size={18} />
                    {/if}
                </button>
            </div>
        </div>
    </nav>
</header>

<style lang="scss">
    header {
        --header-border-bottom: 1px solid #0001;
        border-bottom: var(--header-border-bottom);
    }

    @media (prefers-color-scheme: dark) {
        header {
            --header-border-bottom: unset;
        }
    }
    .navbar {
        --navbar-height: 3.5rem;
        background: #fff1;
        position: sticky;
        top: 0;
        left: 0;
        right: 0;

        .container {
            min-height: var(--navbar-height);
            display: flex;
            justify-content: space-between;

            .navbar-brand {
                display: flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                color: var(--text-color-tertiary);
                gap: 0.5rem;

                .avatar {
                    border-radius: 50%;
                    width: calc(var(--avatar-size) * 0.8);
                    height: calc(var(--avatar-size) * 0.8);
                }

                .brand-text {
                    font-size: 18px;
                    line-height: 27px;
                    font-weight: normal;
                    margin: 0;
                }
            }

            .nav {
                display: flex;
                padding-left: 0;

                li {
                    list-style: none;
                    a {
                        padding: 0.25rem 0.5rem;
                        color: var(--text-color);
                    }
                }
            }
            .sm {
                display: none;
            }
            #button {
                width: auto;
                --button-bg-color: transparent;
            }
        }
    }

    @media screen and (max-width: 600px) {
        .navbar {
            --navbar-height: 3rem;
            .container {
                .navbar-brand {
                    padding-left: var(--content-padding);
                    .brand-text {
                        display: none;
                    }
                }
                .nav {
                    display: none;
                }
                .sm {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-right: 0.5rem;
                }
            }
            &.reponsive {
                position: relative;

                .container {
                    flex-flow: column;

                    .navbar-brand {
                        min-height: var(--navbar-height);

                        .brand-text {
                            display: none;
                        }
                    }

                    .nav {
                        display: block;
                        position: relative;
                        padding-left: 0;

                        li {
                            a {
                                display: block;
                                text-align: center;
                                padding: 1rem 2rem;
                            }
                        }
                    }

                    .sm {
                        position: absolute;
                        min-height: var(--navbar-height);
                        top: 0;
                        right: 0;
                    }
                }
            }
        }
    }
</style>
