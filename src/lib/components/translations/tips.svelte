<script lang="ts">
    import { dev } from "$app/environment";
    import { locale, t, l, locales } from "$lib/translations";
    import { IconLanguage } from "@tabler/icons-svelte";

    export let localeContext: any;
    export let post: any;

    $: suggestions = Array.from(
        new Set<string>(
            (localeContext.acceptLanguages || []).map((lang: string) => {
                return (
                    (post.langs || []).find((l: string) => l === lang) ||
                    (post.langs || [])
                        .map((l: string) => l.split("-")[0])
                        .find((l: string) => l === lang.split("-")[0])
                );
            }),
        ),
    );

    $: currentPageLocale = $locale || localeContext.uiLocale;
    $: currentContentLocale = post.lang || localeContext.contentLocale;
    $: suggectionLocale =
        localeContext.cookieLocale ||
        suggestions.find((l: string) => $locales.includes(l)) ||
        $locales.find((l: string) => l === localeContext.preferedLanguage) ||
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

{#if currentPageLocale !== currentContentLocale || (suggestions.length > 0 && !suggestions.includes(currentContentLocale)) || currentContentLocale !== localeContext.preferedLanguage}
    <div class="container">
        <div class="alert alert-info no-print">
            <strong style="display: flex; align-items: center; gap: .25rem;"
                ><IconLanguage size={18} />
                {$l(suggectionLocale, "common.i18n_alert_title")}</strong
            >
            <span>
                {$l(suggectionLocale, "common.i18n_alert_message_a")}<a
                    href="/{post.lang}{post.url}"
                    >{$l(suggectionLocale, `lang.${post.lang}`)}</a
                >{#if post.langs?.length > 1}
                    {$l(suggectionLocale, "common.i18n_alert_message_b")}

                    {#each suggestions as lang, index}
                        {#if lang !== post.lang}
                            <a href="/{lang}{post.url}"
                                >{$l(suggectionLocale, `lang.${lang}`)}</a
                            >
                            {#if suggestions.length - 2 > index}
                                {$l(suggectionLocale, "common.comma")}
                            {/if}
                        {/if}
                    {/each}
                    {$l(suggectionLocale, "common.i18n_alert_message_c")}{/if}
            </span>
        </div>
    </div>
{/if}
