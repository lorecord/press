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
            <h4>
                {#if mention.published}
                    <Time
                        date={mention.published}
                        class="dt-published"
                        locale={$locale}
                    />
                {/if}
                <a href={mention.url} rel="nofollow">{mention.author?.name}</a>
            </h4>
            <div class="citation-body">
                {@html mention.content}
            </div>
        </li>
    {/each}
</ul>

<style lang="scss">
    .citations {
        display: flex;
        list-style: none;
        gap: 1rem;

        &.reverse {
            flex-flow: column-reverse;
        }
        h4 {
            margin-top: 0;
            margin-bottom: 0.5rem;
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
