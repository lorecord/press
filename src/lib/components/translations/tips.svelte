<script lang="ts">
    import { locale, t } from "$lib/translations";
    import { IconLanguage } from "@tabler/icons-svelte";

    export let localeContext: any;
    export let post: any;
</script>

{#if (post.lang && post.lang != ($locale || localeContext.contentLang)) || ($locale || localeContext.contentLang) != localeContext.preferredLang}
    <div class="container">
        <div class="alert alert-info no-print">
            <strong style="display: flex; align-items: center; gap: .25rem;"
                ><IconLanguage size={18} />
                {$t("common.i18n_alert_title")}</strong
            >
            <span>
                {$t("common.i18n_alert_message_a")}<a
                    href="/{post.lang}{post.url}">{$t(`lang.${post.lang}`)}</a
                >{#if post.langs?.length > 1}
                    {$t("common.i18n_alert_message_b")}
                    {#each (post.langs || []).filter((lang) => {
                        return localeContext.acceptLanguages
                            .map((l) => l.split("-")[0])
                            .includes(lang.split("-")[0]);
                    }) as l, index}
                        {#if l !== post.lang}
                            <a href="/{l}{post.url}">{$t(`lang.${l}`)}</a>
                            {#if index < post.langs.length - 2}
                                {$t("common.comma")}
                            {/if}
                        {/if}
                    {/each}
                    {$t("common.i18n_alert_message_c")}{/if}
            </span>
        </div>
    </div>
{/if}
