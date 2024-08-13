<script lang="ts">
    import { t } from "$lib/translations";
    import {
        IconBrandX,
        IconMarkdown,
        IconSend,
        IconMailUp,
    } from "@tabler/icons-svelte";
    import RepliesList from "./reply/list.svelte";
    import ReplyItem from "./reply/item.svelte";
    import { autogrow } from "$lib/ui/actions/textarea";
    import { loading } from "$lib/ui/actions/button";
    import { createEventDispatcher, onMount } from "svelte";

    const dispatch = createEventDispatcher();

    export let replies: any[];
    export let reply: false;
    export let post: {
        slug: string;
        lang: string;
        "x.com"?: any;
        nostr?: any;
        langs: string[];
    };
    export let webmentionEndpoint: string = "";
    export let postUrl: string;
    export let reverse: boolean = false;
    export let mailto: {
        enabled: boolean;
        email: string;
        site: string;
        title: string;
        slug: string;
    } = {
        enabled: false,
        email: "",
        site: "",
        title: "",
        slug: "",
    };

    export let gravatarBase: string;

    let form: HTMLFormElement;
    let textarea: HTMLTextAreaElement;
    let text: string;

    let submmiting = false;

    function saveText() {
        let key = `comment-craft`;
        if (text) {
            sessionStorage.setItem(key, text);
        } else {
            sessionStorage.removeItem(key);
        }
    }

    onMount(() => {
        textarea.addEventListener("change", saveText);
        textarea.addEventListener("input", saveText);

        textarea.addEventListener("keydown", handleKeyDown);

        // load {name, email, website} from locale store
        let name = form.querySelector("input[name=name]") as HTMLInputElement;
        let email = form.querySelector("input[name=email]") as HTMLInputElement;
        let website = form.querySelector(
            "input[name=website]",
        ) as HTMLInputElement;

        if (name) {
            name.value =
                name.value || localStorage.getItem("comment-name") || "";
        }
        if (email) {
            email.value =
                email.value || localStorage.getItem("comment-email") || "";
        }
        if (website) {
            website.value =
                website.value || localStorage.getItem("comment-website") || "";
        }

        // load text from locale store to textarea
        textarea.value =
            textarea.value || sessionStorage.getItem(`comment-craft`) || "";
    });

    function handleKeyDown(event: KeyboardEvent) {
        // Ctrl+Enter or Cmd+Enter
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            // trigger submit event
            if (form.reportValidity()) {
                form.dispatchEvent(
                    new Event("submit", {
                        bubbles: true,
                        cancelable: true,
                    }),
                );
            }
        }
    }

    function handleReplySubmit() {
        submmiting = true;

        // save {name, email, website} to locale store
        let name = form.querySelector("input[name=name]") as HTMLInputElement;
        let email = form.querySelector("input[name=email]") as HTMLInputElement;
        let website = form.querySelector(
            "input[name=website]",
        ) as HTMLInputElement;

        if (name) {
            localStorage.setItem("comment-name", name.value);
        }
        if (email) {
            localStorage.setItem("comment-email", email.value);
        }
        if (website) {
            localStorage.setItem("comment-website", website.value);
        }

        try {
            fetch(`/api/v1/interaction/${post.slug}`, {
                method: "POST",
                body: new FormData(form),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        alert(data.error);
                    } else {
                        //form.reset();
                        textarea.value = "";
                        textarea.dispatchEvent(new Event("change"));
                        sessionStorage.removeItem(`comment-craft`);

                        replies = [data, ...replies];

                        commentHelper.cancelReply();

                        // dispath component event to update comments count
                        dispatch("reply", {});
                    }
                })
                .catch((error) => {
                    alert(error);
                })
                .finally(() => {
                    submmiting = false;
                });
        } catch (error) {
            form.submit();
            submmiting = false;
        }
    }

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
            if (reply.replies?.length) {
                reply.replies = [];
            }
        });

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
            textarea.focus();
        },
        cancelReply() {
            target = "";
        },
    };

    $: replyToReply = replies?.find((reply) => reply.id === target);

    $: mailToLink = `mailto:${encodeURI(`"${mailto.site}"<${mailto.email}>"`)}?subject=${encodeURI(`Re: [${mailto.site}] ${mailto.title}(${mailto.slug}${replyToReply ? `#${replyToReply.id}` : ""})${post.langs?.length > 0 ? ` [${post.lang}]` : ""}`)}&body=${encodeURI(text || "")}`;
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
                    <div class="input-group" style="width: 100%">
                        <label>
                            <input
                                type="url"
                                name="source"
                                placeholder="URL"
                                required
                            />
                            <input
                                type="hidden"
                                name="target"
                                value={postUrl}
                            />
                            <div class="label">URL</div>
                        </label>
                        <button type="submit" class="button-xs-thin"
                            >{$t("common.comment_send")}</button
                        >
                    </div>
                </div>
            </form>
        </details>
    {/if}
    {#if post["x.com"]?.status}
        <details>
            <summary><h4>X.com</h4></summary>
            <a
                rel="syndication noopener nofollow external"
                class="u-syndication"
                href={post["x.com"].status}
                style="display: flex; align-items: center;
                gap: .25rem;"
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
        <form
            method="post"
            class="form form-reply loadable"
            bind:this={form}
            use:loading={submmiting}
            on:submit|preventDefault={handleReplySubmit}
        >
            <input type="hidden" name="slug" value={post.slug} />
            <input type="hidden" name="lang" value={post.lang} />
            <input type="hidden" name="target" value={target} />
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
                        required
                        placeholder={$t("common.comment_text")}
                        bind:value={text}
                        use:autogrow
                        bind:this={textarea}
                        on:keydown={handleKeyDown}
                    />
                    <div class="label">
                        {$t("common.comment_text")}
                        <a
                            href="https://commonmark.org/help/"
                            target="_blank"
                            title="Markdown"
                            rel="help noopener external"
                            class="button button-text"
                            style="color: unset; padding:0; height: auto"
                            ><IconMarkdown size={20} /></a
                        >
                    </div>
                    <div
                        style="position: absolute; top: 0; right: 0; padding: .25rem .5rem; color: var(--text-color-secondary)"
                    ></div>
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
                <span style="color: var(--text-color-secondary); font-size: 67%"
                    >{$t("common.comment_tips")}</span
                >
                <div class="form-row">
                    {#if mailto.enabled}
                        <a
                            rel="noindex noopener"
                            class="button button-xs-block button-pill button-quaternary button-thin"
                            href={mailToLink}
                            style="display: flex; align-items: center; gap: .25em"
                            ><IconMailUp /> {$t("common.reply_via_email")}</a
                        >
                    {/if}
                    <button
                        type="submit"
                        class="button-xs-block button-pill"
                        use:loading={submmiting}
                        style="padding-left: 2rem; padding-right: 3rem"
                        ><IconSend /> {$t("common.comment_submit")}</button
                    >
                </div>
            </div>
        </form>
    </details>
{/if}

{#if !replyToReply}
    <RepliesList comments={tree} {gravatarBase} {commentHelper} {reverse} />
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
        align-items: center;

        @media screen and (max-width: 600px) {
            flex-flow: column-reverse;
            align-items: unset !important;
        }
    }
</style>
