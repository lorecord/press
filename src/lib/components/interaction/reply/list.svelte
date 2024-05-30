<script lang="ts">
    import ReplyItem from "./item.svelte";

    export let comments: any[];

    $: effectedComments = comments.filter((c) => c.type === 'reply');

    export let gravatarBase: string;
    export let commentHelper: any;
    export let showReplies = true;
    export let replying = false;
    export let reverse = true;
</script>

<ul
    class="comments"
    class:replying
    class:replying-one={effectedComments.length === 1}
    class:reverse
>
    {#each effectedComments as comment}
        <li
            id="comment-{comment.id?.toString().substr(-8)}"
            data-id={comment.id}
            class="comment-list-item"
            class:comment-user-verified={!!comment.user}
            class:comment-email-verified={!!comment.verified}
            class:has-reply={comment.replies?.length === 1}
            class:has-replies={comment.replies?.length > 1}
        >
            <ReplyItem
                {gravatarBase}
                item={comment}
                {commentHelper}
                {showReplies}
                {replying}
                replyingOne={effectedComments.length === 1}
            />
        </li>
    {/each}
</ul>

<style lang="scss">
    .comments {
        list-style: none;
        padding-left: calc(var(--avatar-size) + var(--avatar-gap));
        display: flex;
        flex-flow: column;
        gap: 1rem;
        margin: 0;

        &.reverse {
            flex-flow: column-reverse;
        }

        .comment-list-item {
            position: relative;
            margin: 0;

            &::before {
                content: "";
                display: block;
                height: calc(
                    100% - var(--avatar-size) / 2 - var(--avatar-gap) / 3
                );
                position: absolute;
                left: calc(-1 * (var(--avatar-gap) + var(--avatar-size) / 2));
                top: calc(var(--avatar-size) / 2 + var(--avatar-gap) / 3);
            }

            &.has-reply {
                &::before {
                }
            }
            &.has-replies {
                &::before {
                    border-right: 1px solid var(--text-color-tertiary);
                }
            }

            &.reverse:is(:last-child):not(:first-child),
            &:not(.reverse):is(:first-child):not(:last-child) {
                &::before {
                    width: var(--avatar-size);
                    left: calc(
                        -1 * (var(--avatar-gap) + var(--avatar-size) * 1.5)
                    );
                    background: var(--bg-color);
                }
            }
        }

        &.replying {
            gap: 0.25rem;
            margin-left: calc(-1 * var(--avatar-gap));
        }

        &.replying-one {
            margin-left: calc(var(--content-padding) * 2 - 3.5rem);
            padding-left: calc(-1 * (var(--avatar-size) + var(--avatar-gap)));
        }
    }
</style>
