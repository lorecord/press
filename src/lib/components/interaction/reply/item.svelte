<script lang="ts">
    import { locale, t } from "$lib/translations";
    import {
        IconDiscountCheckFilled,
        IconMessageCircle,
        IconExternalLink,
        IconAlien,
        IconDog,
    } from "@tabler/icons-svelte";
    import CommentList from "./list.svelte";
    import Time from "$lib/ui/time/index.svelte";
    import "./reply.css";
    import AuthorAvatar from "./author-avatar.svelte";

    export let item: any;
    export let gravatarBase: string;
    export let commentHelper: any;
    export let showReplies = true;
    export let replying = false;
    export let replyingOne = false;

    $: hasEmail =
        item.author?.email?.hash?.sha256 || item.author?.email?.hash?.md5;
    $: finalAvatarHash =
        item.author?.email?.hash?.sha256 ||
        item.author?.email?.hash?.md5 ||
        item.id;
    $: finalName =
        item.author?.name ||
        (hasEmail
            ? $t("common.comment_nobody")
            : $t("common.comment_anonymous"));
    $: nameSource = item.author?.name
        ? "name"
        : hasEmail
          ? "nobody"
          : "anounymous";
</script>

<article
    class="comment h-site p-comment"
    class:has-reply={item.replies?.length === 1}
    class:has-replies={item.replies?.length > 1}
    class:replying
    class:replying-one={replyingOne}
    lang={item.lang}
>
    <div class="comment-avatar">
        {#if item.author?.url && hasEmail}
            <a href={item.author?.url} rel="noopener author nofollow" data-print-content-none>
                <AuthorAvatar
                    avatar={item.author?.avatar}
                    {gravatarBase}
                    alt={item.author?.name}
                    hash={finalAvatarHash}
                />
            </a>
        {:else}
            <AuthorAvatar
                avatar={item.author?.avatar}
                {gravatarBase}
                alt={item.author?.name}
                hash={finalAvatarHash}
            />
        {/if}
    </div>

    <div class="comment-main">
        <div class="comment-header">
            <span class="comment-author h-card">
                {#if item.author?.url}
                    <a href={item.author?.url} rel="noopener author nofollow" class="u-url"
                        ><span class={`p-name name-${nameSource}`}>{finalName}</span
                        ></a
                    >
                {:else}
                    <span class={`p-name name-${nameSource} `}>{finalName}</span>
                {/if}
                {#if item.author?.user}
                    <span
                        title="Profile Verified"
                        style="display:flex; align-items: center"
                    >
                        <IconDiscountCheckFilled
                            class="user-verified"
                            size={18}
                        />
                    </span>
                {:else if item.author?.verified}
                    <span
                        title="Email Verified"
                        style="display:flex; align-items: center"
                    >
                        <IconDiscountCheckFilled
                            class="email-verified"
                            size={18}
                        />
                    </span>
                {:else if !hasEmail}
                    {#if nameSource === "name"}
                        <span
                            title="Disguised by surfing dog"
                            style="display:flex; align-items: center; color:var(--text-color-quaternary)"
                        >
                            <IconDog class="disguised" size={18} />
                        </span>
                    {:else}
                        <span
                            title="Anonymous"
                            style="display:flex; align-items: center; color:var(--text-color-quaternary)"
                        >
                            <IconAlien class="anonymouse" size={18} />
                        </span>
                    {/if}
                {/if}
            </span>
            <a
                rel="noindex"
                href={`#comment-${item.id?.toString().substr(-8)}`}
                class="comment-permalink"
            >
                {#if item.published}
                    <Time
                        date={item.published}
                        class="dt-published"
                        locale={$locale}
                        style={{
                            color: "var(--text-color-quaternary)",
                        }}
                    />
                {:else}
                    #{item.id?.toString().substr(-8)}
                {/if}
            </a>
        </div>
        <div class="comment-body e-content">
            {#if item.contentHTML}
                {@html item.contentHTML}
            {:else if item.content}
                <p>{item.content}</p>
            {/if}
        </div>
        <div class="comment-footer">
            <div class="extra">
                {#if item.channel !== "native"}
                    <div class="via">
                        <IconAlien size={12} /> <span class="tip">via</span>
                        {item.channel}
                    </div>
                {/if}
            </div>
            <div class="action">
                <a
                    rel="noindex"
                    class="button button-text"
                    style="padding:0; height: auto; gap: 0.125rem;"
                    href={`#reply-${item.id?.toString().substr(-8)}`}
                    on:click|preventDefault={commentHelper.replyTo(item.id)}
                >
                    <IconMessageCircle size={18} />
                    {#if item.replies?.length > 0}
                        {item.replies?.length}
                    {/if}
                </a>
                {#if item.url}
                    <a
                        class="button button-text"
                        style="padding:0; height: auto"
                        href={item.url}
                        rel="external noopener nofollow"
                    >
                        <IconExternalLink size={18} />
                    </a>
                {/if}
            </div>
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
    .name-nobody,
    .name-anounymous {
        color: var(--text-color-quaternary);
    }
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

        width: calc(var(--avatar-size));
        height: calc(var(--avatar-size));
        border-radius: 50%;
        background: var(--bg-color);

        overflow: hidden;

        position: absolute;
        margin-left: calc(-1 * (var(--avatar-size) + var(--avatar-gap)));
        margin-top: calc(var(--avatar-gap) / 3);
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
                color: var(--text-color-secondary);
            }
        }

        @media screen and (max-width: 400px) {
            flex-flow: column;
            gap: 0.125rem;
            align-items: flex-start;

            .comment-permalink {
                font-size: 67%;
            }
        }
    }

    .comment-footer {
        .extra {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            color: var(--text-color-quinary);
            font-size: 67%;

            .via {
                display: flex;
                align-items: center;
                gap: 0.125rem;
                color: var(--text-color-quaternary);

                .tip {
                    color: var(--text-color-quinary);
                }
            }
        }
        .action {
            display: flex;
            gap: 1rem;
            justify-content: space-between;
        }

        a {
            display: inline-flex;
            align-items: center;
            color: var(--text-color-quaternary);
        }
    }

    .avatar {
        background-color: rgba(0, 0, 0, 0.125);
    }
</style>
