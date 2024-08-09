<script lang="ts">
    import { locale } from "$lib/translations";
    import Time from "$lib/ui/time/index.svelte";
    import "./mentions.css";

    export let mentions: any[];
    export let reverse = true;
</script>

<ul class="citations" class:reverse>
    {#each mentions as mention}
        <li
            id="citation-{mention.id?.toString().substr(-8)}"
            data-id={mention.id}
            class="citations-list-item"
        >
            {#if mention.published}
                <Time
                    date={mention.published}
                    class="dt-published"
                    locale={$locale}
                />
            {/if}
            <h4>
                {#if mention.author?.name}
                    {#if mention.author?.url}
                        <a href={mention.author?.url} rel="nofollow"
                            >{mention.author?.name}</a
                        >
                    {:else}
                        {mention.author?.name}
                    {/if}
                {/if}
                {#if mention.url}
                    <a href={mention.url} rel="nofollow"
                        >{mention.title || mention.url}</a
                    >
                {/if}
            </h4>
            <div class="citation-body">
                {#if mention.content}
                    {@html mention.content}
                {/if}
            </div>
        </li>
    {/each}
</ul>

<style lang="scss">
    .citations {
        display: flex;
        list-style: none;
        gap: 1rem;

        .citations-list-item {
            display: flex;
            gap: 1rem;

            margin-bottom: 0.5rem;

            @media screen and (max-width: 800px) {
                flex-flow: column;
                gap: 0;
            }
        }

        &.reverse {
            flex-flow: column-reverse;
        }
        h4 {
            margin-top: 0;
            margin-bottom: 0;

            display: flex;
            gap: 1rem;

            @media screen and (max-width: 600px) {
                flex-flow: column;
                gap: 0;
            }
        }

        .citation-body {
            font-size: 80%;
            color: var(--text-color-secondary);
        }

        a {
            color: var(--text-color-secondary);
        }
    }
</style>
