<script lang="ts">
    import { t } from "$lib/translations";
    import { IconBrandX, IconX } from "@tabler/icons-svelte";
    import CommentList from "./comment/list.svelte";

    export let comments: any[];
    export let reply: false;
    export let post: { slug: string; lang: string; "x.com"?: any; nostr?: any };
    export let webmentionEndpoint: string = "";
    export let postUrl: string;

    export let gravatarBase: string;

    function buildCommentTree(comments: any[]): any[] {
        let tree: any[] = [];

        if (!comments?.length) {
            return tree;
        }

        let map = comments.reduce((map, comment) => {
            map[comment.id] = comment;
            return map;
        }, {});

        comments.forEach((comment) => {
            let parent = comment.reply || comment.reply_to;

            if (parent) {
                if (map[parent]) {
                    if (!map[parent].replies) {
                        map[parent].replies = [];
                    }
                    map[parent].replies.push(comment);
                } else {
                    tree.push(comment);
                }
            } else {
                tree.push(comment);
            }
        });

        return tree;
    }

    $: tree = buildCommentTree(comments);

    let replyTo = "";
    let commentHelper = {
        replyTo(id: string) {
            replyTo = id;
        },
        cancelReply() {
            replyTo = "";
        },
    };

    $: commentToReply = comments?.find((comment) => comment.id === replyTo);
</script>

{#if reply}
    {#if webmentionEndpoint}
        <details>
            <summary><h4>{$t("common.webmention")}</h4></summary>
            <form
                method="post"
                class="form form-webmention"
                action={webmentionEndpoint || ""}
            >
                <input type="hidden" name="source" value="" />
                <div class="form-row">
                    <label>
                        <input
                            type="url"
                            name="source"
                            placeholder="URL"
                            required
                        />
                        <input type="hidden" name="target" value={postUrl} />
                        <div class="label">URL</div>
                    </label>
                </div>
                <button type="submit">{$t("common.comment_send")}</button>
            </form>
        </details>
    {/if}
    {#if post["x.com"]?.status}
        <details>
            <summary><h4>X.com</h4></summary>
            <a
                rel="syndication external"
                class="u-syndication"
                href={post["x.com"].status}
                style="display: flex"
                target="_blank"><IconBrandX />{post["x.com"].status}</a
            >
        </details>
    {/if}
    {#if post.nostr?.note}
        <details>
            <summary><h4>Nostr</h4></summary>
            <pre>{post.nostr.note}</pre>
        </details>
    {/if}
    <details>
        <summary><h4>{$t("common.comment_form")}</h4></summary>
        {#if commentToReply}
            <div class="reply-to">
                <div class="reply-to-content">
                    <CommentList
                        {gravatarBase}
                        comments={[commentToReply]}
                        commentHelper={{
                            replyTo: () => {},
                        }}
                        showReplies={false}
                    />
                </div>
                <h3 class="reply-to-title">
                    {$t("common.reply_to")}
                    {commentToReply.author}
                    <a
                        href={`#comment-${commentToReply.id
                            ?.toString()
                            .substr(-8)}`}
                        on:click={commentHelper.cancelReply}
                        >{$t("common.reply_to_cancel")}</a
                    >
                </h3>
            </div>
        {/if}
        <form method="post" class="form form-reply">
            <input type="hidden" name="slug" value={post.slug} />
            <input type="hidden" name="lang" value={post.lang} />
            <input type="hidden" name="reply" value={replyTo} />
            <div class="form-row">
                <label>
                    <input
                        type="text"
                        name="name"
                        placeholder={$t("common.comment_author")}
                    />
                    <div class="label">
                        {$t("common.comment_author")}
                    </div>
                </label>
                <label>
                    <input
                        type="email"
                        name="email"
                        placeholder={$t("common.comment_email")}
                    />
                    <div class="label">
                        {$t("common.comment_email")}
                    </div>
                </label>
            </div>
            <div class="form-row">
                <label>
                    <input
                        type="text"
                        name="website"
                        placeholder={$t("common.comment_url")}
                    />
                    <div class="label">
                        {$t("common.comment_url")}
                    </div>
                </label>
                <label style="display:none">
                    <input
                        type="text"
                        name="captcha"
                        placeholder={$t("common.comment_captcha")}
                        tabindex="-1"
                        autocomplete="off"
                    />
                    <div class="label">
                        {$t("common.comment_captcha")}
                    </div>
                </label>
            </div>
            <label>
                <textarea name="text" placeholder={$t("common.comment_text")} />
                <div class="label">
                    {$t("common.comment_text")}
                </div>
            </label>
            <div>
                <button type="submit">{$t("common.comment_submit")}</button>
            </div>
        </form>
    </details>
{/if}

{#if !commentToReply}
    <CommentList comments={tree} {gravatarBase} {commentHelper} />
{/if}

<style lang="scss">
    .form {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }

    .form-row {
        display: flex;
        flex-flow: row;
        gap: 0.5rem;
    }
</style>
