<script lang="ts">
    import { t } from "$lib/translations";
    import { IconBrandX, IconMarkdown } from "@tabler/icons-svelte";
    import RepliesList from "./reply/list.svelte";
    import ReplyItem from "./reply/item.svelte";
    import { autogrow } from "$lib/ui/actions/textarea";

    export let replies: any[];
    export let reply: false;
    export let post: { slug: string; lang: string; "x.com"?: any; nostr?: any };
    export let webmentionEndpoint: string = "";
    export let postUrl: string;

    export let gravatarBase: string;

    function buildReplyTree(replies: any[]): any[] {
        let tree: any[] = [];

        if (!replies?.length) {
            return tree;
        }

        let map = replies.reduce((map, reply) => {
            map[reply.id] = reply;
            return map;
        }, {});

        replies.forEach((reply) => {
            let parent = reply.target;

            if (parent) {
                if (map[parent]) {
                    if (!map[parent].replies) {
                        map[parent].replies = [];
                    }
                    map[parent].replies.push(reply);
                } else {
                    tree.push(reply);
                }
            } else {
                tree.push(reply);
            }
        });

        return tree;
    }

    $: tree = buildReplyTree(replies);

    let target = "";
    let commentHelper = {
        replyTo(id: string) {
            target = id;
        },
        cancelReply() {
            target = "";
        },
    };

    $: replyToReply = replies?.find((reply) => reply.id === target);
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
    <details open>
        <summary><h4>{$t("common.comment_form")}</h4></summary>
        {#if replyToReply}
            <div class="reply-to">
                <div
                    class="reply-to-content"
                    style="padding: 1rem; padding-left: calc(var(--avatar-size) + var(--avatar-gap));"
                >
                    <ReplyItem
                        {gravatarBase}
                        item={replyToReply}
                        commentHelper={{
                            replyTo: () => {},
                        }}
                    />
                </div>
                <h3 class="reply-to-title" style="margin-top: .33em">
                    {$t("common.reply_to")}
                    {replyToReply.author?.name}
                    <a
                        href={`#comment-${replyToReply.id
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
            <input type="hidden" name="reply" value={target} />
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
            </div>
            <div class="form-row">
                <label>
                    <textarea
                        name="text"
                        placeholder={$t("common.comment_text")}
                        use:autogrow
                    />
                    <div class="label">
                        {$t("common.comment_text")}
                    </div>
                    <div
                        style="position: absolute; top: 0; right: 0; padding: .25rem .5rem; color: var(--text-color-secondary)"
                    >
                        <IconMarkdown />
                    </div>
                </label>
            </div>
            <div class="form-row">
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
            <div
                class="form-row"
                style="justify-content: space-between; align-items: center;"
            >
                <span style="color: var(--text-color-secondary)"
                    >{$t("common.comment_tips")}</span
                >
                <button
                    type="submit"
                    style="padding-left: 3rem; padding-right: 3rem"
                    >{$t("common.comment_submit")}</button
                >
            </div>
        </form>
    </details>
{/if}

{#if !replyToReply}
    <RepliesList comments={tree} {gravatarBase} {commentHelper} />
{/if}

<style lang="scss">
    .form {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
        padding: 1rem;
    }

    .form-row {
        display: flex;
        flex-flow: row;
        gap: 0.5rem;

        @media screen and (max-width: 600px) {
            flex-flow: column;
        }
    }
</style>
