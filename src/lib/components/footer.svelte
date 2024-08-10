<script context="module">
    import { invalidate } from "$app/navigation";
    import { locale } from "$lib/translations";
    import { browser } from "$app/environment";

    locale.subscribe((value) => {
        if (browser) {
            invalidate("locale:locale");
        }
    });
</script>

<script lang="ts">
    import { t, locales, setLocale } from "$lib/translations";
    import { IconLanguage } from "@tabler/icons-svelte";

    export let posts: any[];
    export let supportedLocales = ["en"];
    export let siteConfig: any;
    export let allowUnsupportedLocales = false;

    const handleLocaleSelect = (e: any) => {
        document.cookie = `locale=${e?.target?.value};path=/;max-age=31536000`;
        setLocale(e?.target?.value);
    };
</script>

<footer class="no-print">
    <div class="container text-center">
        <span class="copyright">
            {$t("common.copyright")} &copy; {siteConfig.copyright?.start
                ? `${siteConfig.copyright.start}-`
                : ""}{new Date().getFullYear()}
            <a href={siteConfig.url}>{siteConfig.title}</a>
            {$t("common.all_rights_reversed")}
        </span>
        {#if siteConfig.issn}
            <span class="issn">
                <abbr title="International Standard Serial Number">ISSN</abbr>
                <a
                    rel="noopener nofollow"
                    href={`https://portal.issn.org/resource/ISSN/${siteConfig.issn}`}
                    ><span itemprop="issn">{siteConfig.issn}</span></a
                >
            </span>
        {/if}
        {#if $locale == "zh-CN" && siteConfig.beian}
            <span class="beian">
                <a
                    href="https://beian.miit.gov.cn/"
                    data-spacer="ignore"
                    rel="external nofollow noopener noreferrer"
                    >{siteConfig.beian}</a
                >
            </span>
        {/if}
        {#await posts then value}
            {#if value?.some && value.some((p) => p.menu.footer)}
                <ul class="menu">
                    {#each value as p}
                        {#if p.menu?.footer}
                            <li class="nav-item">
                                <a href={p.url} class="nav-link"
                                    >{p.menu.label || p.title}</a
                                >
                            </li>
                        {/if}
                    {/each}
                </ul>
            {/if}
        {/await}
        {#if supportedLocales?.length > 1}
            <span class="locale">
                <IconLanguage size={20} />
                <select value={$locale} on:change={handleLocaleSelect}>
                    {#each supportedLocales as value}
                        <option {value} on:click={handleLocaleSelect}
                            >{$t(`lang.${value}`)}</option
                        >
                    {/each}
                    {#if allowUnsupportedLocales && $locales?.length > supportedLocales?.length}
                        <optgroup label="Unsupported">
                            {#each $locales.filter((l) => !supportedLocales.includes(l)) as value}
                                <option {value} on:click={handleLocaleSelect}
                                    >{$t(`lang.${value}`)}</option
                                >
                            {/each}
                        </optgroup>{/if}
                </select>
            </span>
        {/if}
    </div>
</footer>

<style lang="scss">
    footer {
        font-size: 80%;

        .container {
            display: flex;
            justify-content: center;
            padding: 1rem;
            gap: 0.75rem;
            align-items: center;
            flex-wrap: wrap-reverse;
        }

        &,
        a {
            color: var(--text-color-tertiary);
        }

        a {
            text-decoration: underline;
        }

        .menu {
            display: inline-flex;
            padding-left: 0;
            gap: 0.25rem;
            margin: 0;

            li {
                list-style: none;
            }
        }

        .locale {
            display: flex;
            align-items: center;
            gap: 0.125rem;

            select {
                border: none;
                background: var(--bg-color);
                color: var(--text-color-tertiary);
                padding: 0.25rem;
                cursor: pointer;
            }
        }
    }
</style>
