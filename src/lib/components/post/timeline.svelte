<script lang="ts">
    import { locale, t } from "$lib/translations";

    export let posts: any[];

    $: timeline = ((map) => {
        return Object.keys(map)
            .sort((a: any, b: any) => b - a)
            .map((k) => ({ year: k, posts: map[k] }));
    })(
        posts.reduce((acc, post) => {
            const year = new Date(post.date).getFullYear() + "";
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(post);
            return acc;
        }, {}),
    );
</script>

<ul class="timeline">
    {#each timeline as yearGroup}
        {#each yearGroup.posts as post}
            <li class="timeline-item">
                <time
                    class="dt-published"
                    datetime={new Date(post.date).toISOString()}
                >
                    {new Intl.DateTimeFormat($locale).format(
                        new Date(post.date),
                    )}
                </time>
                <h3><a href={post.url}>{post.title}</a></h3>
            </li>
        {/each}
        <li class="timeline-item">
            <h2>{yearGroup.year}</h2>
        </li>
    {/each}
</ul>

<style lang="scss">
    .timeline {
        position: relative;
        margin: 0 auto;
        list-style: none;
        padding-left: 100px;
    }

    .timeline::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 30px;
        width: 2px;
        background-color: rgb(107, 107, 107);
        margin-left: 20px;
    }

    .timeline-item {
        position: relative;
        padding-left: 40px;
        margin: 0 auto;
        display: flex;
        gap: 0.25rem;
        align-items: center;

        h2,
        h3 {
            margin: 0.33em 0 0.33em;
        }

        h2 {
            font-size: 1.667rem;
        }
        h3 {
            font-size: 1.333rem;
        }
    }

    .timeline-item::before {
        content: "";
        position: absolute;
        left: 13px;
        width: 12px;
        height: 12px;
        background-color: var(--bg-color);
        border: 2px solid rgb(107, 107, 107);
        border-radius: 50%;

        @media (prefers-color-scheme: dark) {
            background-color: rgb(107, 107, 107);
        }
    }

    .timeline-item time {
        position: absolute;
        left: -110px;
        width: 120px;
        padding: 5px;
        font-weight: bold;
        text-align: right;
    }
</style>
