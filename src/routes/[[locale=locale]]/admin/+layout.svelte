<script lang="ts">
</script>

<svelte:head>
    <meta name="referrer" content="origin-when-cross-origin" />
</svelte:head>

<div class="dash-container">
    <aside>
        <h1><a href="/admin">Admin</a></h1>

        <ul>
            <li><a href="/admin/interactions/replies">Replies</a></li>
            <li><a href="/admin/posts">Posts</a></li>
        </ul>
    </aside>
    <main>
        <slot />
    </main>
</div>

<style lang="scss">
    .dash-container {
        display: flex;
        aside {
            width: 15rem;
            padding: 1rem;
        }
        main {
            flex: 1;
        }
    }
</style>
