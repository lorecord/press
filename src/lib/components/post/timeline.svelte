<script lang="ts">
    import { locale, t } from "$lib/translations";
    import Time from "$lib/ui/time/index.svelte";

    export let posts: any[];

    $: timeline = ((map) => {
        return Object.keys(map)
            .sort((a: any, b: any) => b - a)
            .map((k) => ({ year: k, posts: map[k] }));
    })(
        posts.reduce((acc, post) => {
            const year = new Date(post.published.date).getFullYear() + "";
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
                <div>
                    <div class="time">
                        <Time
                            date={post.published.date}
                            class="dt-published"
                            locale={$locale}
                            options={{ dateStyle: "short" }}
                        />
                    </div>
                    <slot name="heading" {post}>
                        <h3><a href={post.route}>{post.title}</a></h3>
                    </slot>
                </div>
            </li>
        {/each}
        <slot name="year" year={yearGroup.year} group={yearGroup}>
            <li class="timeline-item">
                <h2>{yearGroup.year}</h2>
            </li>
        </slot>
    {/each}
</ul>

<style lang="scss">
    .timeline {
        position: relative;
        margin: 0 auto;
        list-style: none;
        padding-left: 100px;

        &::before {
            content: "";
            position: absolute;
            top: 0;
            bottom: 30px;
            width: 2px;
            background-color: rgb(107, 107, 107);
            margin-left: 20px;
        }
    }
    .timeline-item {
        position: relative;
        padding-left: 40px;
        margin: 0 auto;
        display: flex;
        gap: 0.25rem;
        align-items: center;

        > div {
            display: flex;
            align-items: center;
        }

        &::before {
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

        h2,
        h3 {
            margin: 0.33em 0 0.33em;
        }

        h2 {
            font-size: 1.333em;

            @media screen and (max-width: 600px) {
                font-size: 1.444em;
            }
        }
        h3 {
            font-size: 1.133em;

            @media screen and (max-width: 600px) {
                font-size: 1em;
            }
        }

        .time {
            --color: var(--text-color);
            position: absolute;
            left: -110px;
            width: 120px;
            padding: 5px;
            font-weight: bold;
            text-align: right;
            color: var(--color);
        }

        a:hover {
            text-decoration: underline;
        }
    }

    @media screen and (max-width: 600px) {
        .timeline {
            margin: 0;
            padding-left: 0;
            display: flex;
            gap: 1em;
            flex-direction: column;
        }

        .timeline-item {
            padding-left: 40px;
            align-items: baseline;
            margin-left: 0;

            &::before {
                top: calc(1em / 2);
            }

            > div {
                display: flex;
                align-items: start;
                flex-direction: column-reverse;
            }

            h2,
            h3 {
                margin: 0;
            }

            .time {
                --color: var(--text-color-secondary);
                position: static;
                width: auto;
                padding: 0;
                line-height: 1;
                font-weight: normal;
            }
        }
    }
</style>
