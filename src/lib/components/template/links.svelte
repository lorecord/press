<script lang="ts">
    export let post: any;

    $: ({ title, summary_html, url, date, image, review, data } = post);
</script>

<div class="container">
    <h1>{post.title}</h1>
    {#if post.content?.html}
        {@html post.content?.html}
    {/if}
    <ul>
        {#each (data?.links || [])
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
