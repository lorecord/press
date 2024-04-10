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
        }, {})
    );
</script>

<ul class="timeline">
    {#each timeline as yearGroup}
        {#each yearGroup.posts as post}
            <li class="timeline-item">
                <time
                    class="dt-published"
                    datetime={new Date(post.date).toString()}
                >
                    {new Intl.DateTimeFormat($locale).format(
                        new Date(post.date)
                    )}
                </time>
                <h3><a href={post.url}>{post.title}</a></h3>
            </li>
        {/each}
        <li class="timeline-item">
            <h3>{yearGroup.year}</h3>
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
    }

    .timeline-item::before {
        content: "";
        position: absolute;
        left: 13px;
        width: 12px;
        height: 12px;
        background-color: rgb(107, 107, 107);
        border: 2px solid rgb(107, 107, 107);
        border-radius: 50%;
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
