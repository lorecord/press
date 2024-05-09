<script lang="ts">
    import { locale } from "$lib/translations";

    export let related: any[];
</script>

<ul class="related">
    {#each related as r}
        <li>
            <h4>
                <time
                    class="dt-published"
                    datetime={new Date(r.post.date).toISOString()}
                >
                    {new Intl.DateTimeFormat($locale, {
                        dateStyle: "short",
                    }).format(new Date(r.post.date))}
                </time>
                <a href={r.post.url} data-related={r.score}>{r.post.title}</a>
            </h4>
        </li>
    {/each}
</ul>

<style lang="scss">
    .related {
        list-style: none;
        color: var(--text-color-tertiary);
    }

    h4 {
        margin: 0.33em 0 0.33em;
    }

    h4 {
        font-size: 1.333rem;
    }
</style>
