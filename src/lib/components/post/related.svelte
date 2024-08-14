<script lang="ts">
    import { locale } from "$lib/translations";
    import Time from "$lib/ui/time/index.svelte";

    export let related: any[];
</script>

<ul class="related">
    {#each related as r}
        <li>
            <Time
                date={r.post.date}
                class="dt-published"
                locale={$locale}
                options={{ dateStyle: "short" }}
            />
            <h4>
                <a href={r.post.url} data-related={r.score}>
                    <span lang={r.post.lang}>{r.post.title} </span>
                </a>
            </h4>
        </li>
    {/each}
</ul>

<style lang="scss">
    .related {
        list-style: none;
        color: var(--text-color-tertiary);
        width: fit-content;
        margin: 0 auto;
        padding-left: 0;

        li {
            display: flex;
            align-items: center;
            gap: 0.5em;
            font-weight: bold;
        }
    }

    h4 {
        margin: 0.33em 0 0.33em;
    }

    @media screen and (max-width: 600px) {
        .related {
            li {
                flex-direction: column-reverse;
                gap: 0;
                font-size: 0.9em;
                align-items: baseline;
                margin: 1em;

                h4 {
                    margin: 0;
                }
            }
        }
    }
</style>
