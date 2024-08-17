<script lang="ts">
    import type { PageData } from "./$types";

    export let data: PageData;

    $: ({ posts } = data || {});
</script>

<ul>
    {#await posts then posts}
        {#each posts as post}
            <li>
                <a href={`/admin/posts/${post.id}`}>
                    {post.title}
                </a>
            </li>
        {/each}
    {/await}
</ul>
