<script lang="ts">
    export let post: any;

    $: ({ title, summary_html, url, date, image, review, links } = post);
</script>

<div class="container">
    <h1>{post.title}</h1>
    {@html post.content}
    <ul>
        {#each links || [] as link}
            <li>
                <a href={link.url}>{link.name}</a>
            </li>
        {:else}
            <p>None.</p>
        {/each}
    </ul>
</div>
