<script lang="ts">
    import type { Post } from "$lib/post/types";

    export let post: Post = {} as Post;

    $: ({ title, data } = post);
</script>

<div class="container">
    <h1>{post.title}</h1>
    {#if post.content?.html}
        {@html post.content?.html}
    {/if}
    <ul>
        {#each (data?.links || data?.data?.links || [])
            .map((value) => ({ value, w: Math.random() }))
            .sort((a, b) => a.w - b.w)
            .map(({ value }) => value) as link}
            <li>
                <a rel="noopener external" href={link.url}>{link.name}</a>
            </li>
        {:else}
            <p>None.</p>
        {/each}
    </ul>
</div>
