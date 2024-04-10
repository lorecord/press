<script lang="ts">
    import { locale } from "$lib/translations";
    import "./citation.css";

    export let comments: any[];
    export let reverse = true;
</script>

<ul class="citations" class:reverse>
    {#each comments as comment}
        <li
            id="citation-{comment.id?.toString().substr(-8)}"
            data-id={comment.id}
            class="citations-list-item"
        >
            <h4>
                <time
                    class="dt-published"
                    datetime={new Date(comment.date).toString()}
                >
                    {new Intl.DateTimeFormat($locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                    }).format(new Date(comment.date))}
                </time>
                <a href={comment.url} rel="nofollow">{comment.author}</a>
            </h4>
            <div class="citation-body">
                {@html comment.text}
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
            color: var(--text-color-secondary);
        }
    }
</style>
