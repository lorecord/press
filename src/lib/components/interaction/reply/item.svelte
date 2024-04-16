<script lang="ts">
    import { locale } from "$lib/translations";
    import {
        IconDiscountCheckFilled,
        IconMessageCircle,
    } from "@tabler/icons-svelte";
    import CommentList from "./list.svelte";
    import "./reply.css";

    export let item: any;
    export let gravatarBase: string;
    export let commentHelper: any;
    export let showReplies = true;
    export let replying = false;
    export let replyingOne = false;
</script>

<article
    class="comment"
    class:has-reply={item.replies?.length === 1}
    class:has-replies={item.replies?.length > 1}
    class:replying
    class:replying-one={replyingOne}
>
    {#if item.author?.email?.hash?.md5}
        <div class="comment-avatar">
            {#if item.url}
                <a href={item.url} rel="external nofollow">
                    <img
                        class="avatar rounded-circle"
                        src={`${gravatarBase || "//gravatar.com"}/avatar/${item.author?.email?.hash?.md5}?s=48`}
                        alt={item.author?.name}
                    />
                </a>
            {:else}
                <img
                    class="avatar rounded-circle"
                    src={`${gravatarBase || "//gravatar.com"}/avatar/${item.author?.email?.hash?.md5}?s=48`}
                    alt={item.author?.name}
                />
            {/if}
        </div>
    {/if}
    <div class="comment-main">
        <div class="comment-header">
            <span class="comment-author">
                {#if item.author?.url}
                    <a href={item.author?.url} rel="external nofollow"
                        >{item.author?.name}</a
                    >
                {:else}
                    {item.author?.name}
                {/if}
                {#if item.author?.user}
                    <IconDiscountCheckFilled class="user-verified" size={18} />
                {:else if item.author?.verified}
                    <IconDiscountCheckFilled class="email-verified" size={18} />
                {/if}
            </span>
            <a
                href={`#comment-${item.id?.toString().substr(-8)}`}
                class="comment-permalink"
            >
                <time
                    class="dt-published"
                    datetime={new Date(item.published).toString()}
                >
                    {new Intl.DateTimeFormat($locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                    }).format(new Date(item.published))}
                </time>
            </a>
        </div>
        <div class="comment-body">
            {@html item.content}
        </div>
        <div class="comment-footer">
            <a
                href={`#reply-${item.id?.toString().substr(-8)}`}
                on:click|preventDefault={commentHelper.replyTo(item.id)}
            >
                <IconMessageCircle size={18} />
                {#if item.replies?.length > 0}
                    {item.replies?.length}
                {/if}
            </a>
        </div>
    </div>
</article>

{#if showReplies && item.replies}
    <CommentList
        {gravatarBase}
        comments={item.replies}
        {commentHelper}
        {showReplies}
        replying={true}
    />
{/if}

<style lang="scss">
    article {
        position: relative;

        &::before {
            content: "";
            position: absolute;

            height: calc(100% - (var(--avatar-size) / 2));
            width: calc(var(--avatar-size));
            left: calc(-1 * (var(--avatar-size) * 1.5 + var(--avatar-gap)));
            top: calc(var(--avatar-size) / 2 + var(--avatar-gap) / 3);
        }

        &.replying.replying-one {
            &::before {
            }
        }
        &.replying:not(.replying-one) {
            &::before {
                border-top: 1px solid var(--text-color-tertiary);
            }
        }
    }
    .has-reply {
        &::before {
            border-right: 1px solid var(--text-color-tertiary);
        }
    }

    .comment-permalink:hover {
        text-decoration: none;
    }

    .comment-avatar {
        --border-size: 3px;

        position: absolute;
        margin-left: calc(-1 * (var(--avatar-size) + var(--avatar-gap)));
        padding-top: calc(var(--avatar-gap) / 3);

        img {
            border: var(--border-size) solid var(--bg-color);
            border-radius: 50%;
            width: calc(var(--avatar-size));
            height: calc(var(--avatar-size));
            background: var(--bg-color);
        }
    }

    .comment-main {
        display: flex;
        flex-flow: column;
        gap: 0.25rem;
    }

    .comment-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .comment-author {
            display: flex;
            align-items: center;
            gap: 0.125rem;
            font-weight: 600;

            &,
            a {
                color: var(--text-color);
            }
        }

        time {
            color: var(--text-color-tertiary);
        }
    }

    .comment-footer {
        a {
            display: inline-flex;
            align-items: center;
            color: var(--text-color-tertiary);
        }
    }

    .avatar {
        background-color: rgba(0, 0, 0, 0.125);
    }
</style>
