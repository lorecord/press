<script lang="ts">
    import { dev } from "$app/environment";
    import { locale, t, l, locales } from "$lib/translations";
    import { IconLanguage, IconX } from "@tabler/icons-svelte";
    import { fade } from "svelte/transition";

    export let localeContext: any;
    export let post: any;
    let show: boolean = true;

    $: suggestions = (post.langs || [])
        .map((lang: string) => ({
            lang,
            score: ((acceptLanguages) => {
                let s = 0;
                const index = acceptLanguages.indexOf(lang);
                if (index > -1) {
                    s += (acceptLanguages.length - index) * 2;
                } else {
                    const langPrefix = lang.split("-")[0];
                    let prefixMatchedIndex = acceptLanguages.findIndex(
                        (l: string) => l.split("-")[0] === langPrefix,
                    );

                    if (prefixMatchedIndex > -1) {
                        s += acceptLanguages.length - prefixMatchedIndex;
                    }
                }
            })(localeContext.acceptLanguages || []),
        }))
        .sort((a: any, b: any) => b.score - a.score)
        .map((s: any) => s.lang);

    $: currentPageLocale = $locale || localeContext.uiLocale;
    $: currentContentLocale = post.lang || localeContext.contentLocale;
    $: suggectionLocale =
        localeContext.cookieLocale ||
        $locales.find((l: string) => l === localeContext.preferedLanguage) ||
        suggestions.find((l: string) => $locales.includes(l)) ||
        currentPageLocale;
    $: {
        if (dev) {
            console.log("$locales", suggestions);
            console.log("suggestions", suggestions);
            console.log("currentPageLocale", currentPageLocale);
            console.log("currentContentLocale", currentContentLocale);
            console.log("suggectionLocale", suggectionLocale);
            console.log(
                "show tips",
                currentPageLocale !== currentContentLocale ||
                    (suggestions.length > 0 &&
                        !suggestions.includes(currentContentLocale)) ||
                    currentContentLocale !== localeContext.preferedLanguage,
            );
        }
    }
</script>

{#if show && (currentPageLocale !== currentContentLocale || (suggestions.length > 0 && currentContentLocale != localeContext.preferedLanguage) || (suggestions.length > 0 && !suggestions.includes(currentContentLocale)))}
    <div
        lang={suggectionLocale}
        class="container"
        in:fade|global={{ duration: 150, delay: 150 }}
        out:fade|global={{ duration: 150 }}
    >
        <div class="alert alert-info no-print">
            <strong style="display: flex; align-items: center; gap: .25rem;"
                ><IconLanguage size={18} />
                {$l(suggectionLocale, "common.i18n_alert_title")}</strong
            >
            <span>
                {$l(suggectionLocale, "common.i18n_alert_message_a")}<a
                    href="/{post.lang}{post.url}"
                    >{$l(suggectionLocale, `lang.${post.lang}`)}</a
                >{#if post.langs?.length > 1}{$l(
                        suggectionLocale,
                        "common.i18n_alert_message_b",
                    )}{#each suggestions as lang, index}{#if lang !== post.lang}<a
                                rel="alternate"
                                href="/{lang}{post.url}"
                                >{$l(suggectionLocale, `lang.${lang}`)}</a
                            >{#if suggestions.length - 2 > index}{$l(
                                    suggectionLocale,
                                    "common.comma",
                                )}{/if}{/if}{/each}{$l(
                        suggectionLocale,
                        "common.i18n_alert_message_c",
                    )}{/if}
            </span>
            <button
                class="button-close button-text button-thin"
                on:click={() => {
                    show = false;
                }}><IconX /></button
            >
        </div>
    </div>
{/if}

<style lang="scss">
    .alert {
        position: relative;
        padding-right: 3rem;

        @media screen and (max-width: 768px) {
            padding-right: 1rem;
            flex-flow: column;
        }
    }
    .button-close {
        position: absolute;
        right: 0;
    }
</style>
