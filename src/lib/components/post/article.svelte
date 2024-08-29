<script lang="ts">
    import Cite from "$lib/components/cite/index.svelte";
    import License from "$lib/components/license/index.svelte";
    import { locale, t } from "$lib/translations/index.js";
    import Rating from "$lib/ui/rating/index.svelte";
    import Time from "$lib/ui/time/index.svelte";

    import { browser } from "$app/environment";
    import type { Post } from "$lib/post/types";
    import {
        IconBolt,
        IconLanguage,
        IconList,
        IconMessages,
    } from "@tabler/icons-svelte";
    import { afterUpdate, onDestroy, onMount } from "svelte";

    export let post: Post = {} as Post;
    export let systemConfig: any;
    export let siteConfig: any;

    export let header = true;
    export let footer = true;

    export let type: "paper" | "none" = "paper";

    export let lightningSupported = false;

    let activeSectionId = "";
    let observer: IntersectionObserver;
    let handleScroll: any;

    const createhandleScroll = (sections: any) => {
        () =>
            sections.forEach((section: any) => {
                const element = document.getElementById(section.id);
                const bounding = element && element.getBoundingClientRect();

                if ((bounding?.top || 0) >= 0 && (bounding?.top || 0) <= 10) {
                    setActiveSection(section.id);
                }
            });
    };

    const setActiveSection = (id: string) => {
        activeSectionId = id;
        document.querySelectorAll("#article-toc a").forEach((link) => {
            link.classList.toggle(
                "current",
                link.getAttribute("data-target") === id,
            );
        });
    };

    function toc(sections: any[] | undefined) {
        if (!sections) return;
        if (!browser) return;
        const observerOptions = {
            threshold: 0.5,
        };

        const observerCallback: IntersectionObserverCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((section) => {
            let e = document.getElementById(section.id);
            e && observer.observe(e);
        });
        handleScroll = createhandleScroll(sections);
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }

    onMount(() => {
        if (typeof (window as any)?.webln !== "undefined") {
            lightningSupported = true;
        }
    });

    onDestroy(() => {
        if (observer) {
            observer.disconnect();
        }
        if (browser && window && handleScroll) {
            window.removeEventListener("scroll", handleScroll);
        }
    });

    onMount(() => {
        return toc(post.content?.headings);
    });

    afterUpdate(() => {
        if (observer) {
            observer.disconnect();
        }
        if (browser && window && handleScroll) {
            window.removeEventListener("scroll", handleScroll);
        }
        return toc(post.content?.headings);
    });
</script>

<article
    class="typography type-{type} template-{post.template}"
    lang={post.lang}
>
    {#if header}
        <div class="article-header container">
            {#if post.data?.featured}
                <img
                    class="no-print u-featured"
                    src={post.data?.featured}
                    alt=""
                    style="max-width: 100%"
                />
            {/if}
            {#if post.title}
                <h1 class="p-name">{post.title}</h1>
            {/if}
            {#if post.template == "item"}
                <div class="article-meta">
                    {#if post.author && !(post.author.length === 1 && post.author[0].user === systemConfig.user?.default)}
                        {#each post.author as author}
                            <span>{author.name}</span>
                        {/each}
                    {/if}

                    {#if post.data?.review}
                        {@const review = post.data?.review}
                        <div>
                            <span lang={$locale}>{$t("common.review")}</span>
                            {#if review.item?.url}
                                <a
                                    class="u-review-of"
                                    style={review.rating > 6
                                        ? ""
                                        : "color: var(--text-color-tertiary)"}
                                    href={review.item.url}
                                    rel={"external noopener" +
                                        `${
                                            review.rating > 6
                                                ? " "
                                                : " nofollow"
                                        }`}>{review.item.name}</a
                                >
                            {:else}
                                <span>{review.item.name}</span>
                            {/if}
                            <Rating value={review.rating} />
                        </div>
                    {/if}

                    {#if post.data?.reply}
                        {@const reply = post.data?.reply}
                        <div>
                            <span lang={$locale}>
                                {#if reply.item?.url}
                                    <a
                                        class="u-in-reply-to"
                                        href={reply.item.url}
                                        >{reply.item.name}</a
                                    >
                                {:else}
                                    {reply.item.name}
                                {/if}
                            </span>
                        </div>
                    {/if}

                    <Time
                        date={post.published?.date}
                        class="dt-published"
                        locale={$locale}
                    />
                </div>
            {:else if post.template == "note"}
                <div class="article-meta">
                    <Time
                        date={post.published?.date}
                        class="dt-published"
                        locale={$locale}
                    />
                </div>
            {/if}

            <div style="display:none">
                <a class="u-url" href={siteConfig.url + post.route}
                    >{post.title}</a
                >
                <p class="p-summary">{post.summary?.raw}</p>
            </div>
        </div>
    {/if}
    <div class="article-body container">
        {#each post.photo || [] as photo}
            <img
                class="u-photo"
                src={photo.src}
                alt=""
                style="width: 100%; margin: 2rem 0 1rem;"
            />
        {/each}
        {#each post.image || [] as image}
            {#if image}
                <img
                    class="u-photo"
                    src={image}
                    alt=""
                    style="margin: 2rem auto 1rem; max-width: 100%"
                />
            {/if}
        {/each}
        {#each post.audio || [] as audio}
            <audio
                class="u-audio"
                src={audio.src}
                controls
                style="display: block; padding: 2rem; width: 100%"
                data-print-content={audio.src}
            />
        {/each}
        {#each post.video || [] as video}
            <video
                class="u-video"
                src={video.src}
                data-print-content={video.src}
                controls
                style="max-width: 100%;
                    max-height: 100vh;
                    min-width: 300px;
                    margin: 0rem auto;
                    display: block;
                    padding: 2rem 0 1rem;"
            >
                <track kind="captions" />
            </video>
        {/each}
        {#if post.toc?.enabled && post.content?.headings}
            <div class="article-aside no-print">
                <aside>
                    {#if post.toc?.enabled && post.content?.headings}
                        <details class="article-toc" open id="article-toc">
                            <summary>
                                <h3>
                                    <span lang={$locale}
                                        >{$t("common.toc")}</span
                                    >
                                </h3>
                            </summary>
                            <ul>
                                {#each post.content.headings as { level, text, id }}
                                    <li
                                        style="margin-left: {level * 10 - 20}px"
                                    >
                                        <a
                                            href={`#${id}`}
                                            data-target={id}
                                            on:click={(e) =>
                                                setActiveSection(id)}>{text}</a
                                        >
                                    </li>
                                {/each}
                            </ul>
                        </details>
                        <a
                            href="#article-toc"
                            id="toc-button"
                            class="button button-3 button-square button-pill"
                            ><IconList size={20} /></a
                        >
                    {/if}
                </aside>
            </div>
        {/if}
        {#if post.content?.html}
            <div class="e-content article-content">
                {@html post.content?.html}
            </div>
        {/if}
        {#if post.comment?.enabled}
            <div class="article-aside article-aside-left no-print">
                <aside>
                    {#if post.comment?.enabled}
                        <a
                            id="comments-link"
                            href="#comments"
                            class="button button-3 button-square button-pill"
                            ><IconMessages size={20} /></a
                        >
                    {/if}
                </aside>
            </div>
        {/if}
    </div>
    {#if footer}
        <div class="article-footer container">
            <div class="article-extra">
                {#if post.template == "item" && post.license !== "false" && (post.license || systemConfig.license?.default)}
                    <div class="article-license">
                        <div class="article-license-base-info">
                            <div><strong>{post.title}</strong></div>
                            <div>
                                <a
                                    rel="bookmark"
                                    class="link"
                                    href={post.route}
                                    data-print-content-none
                                    >{siteConfig.url}{post.route}</a
                                >
                            </div>
                        </div>
                        <div class="article-license-meta">
                            {#if post.author}
                                <div class="article-license-meta-item">
                                    <div class="label">
                                        <span lang={$locale}
                                            >{$t("common.author")}</span
                                        >
                                    </div>
                                    <div
                                        class="value"
                                        style="display: flex;
                                    align-items: center;
                                    gap: .25rem;"
                                    >
                                        {#each post.author as author}
                                            <span
                                                style="margin:0"
                                                class="h-card p-author"
                                            >
                                                <img
                                                    style="display:none"
                                                    alt={author.name}
                                                    class="u-photo"
                                                    src={siteConfig.url +
                                                        "/favicon.png"}
                                                />
                                                <a
                                                    class="p-name u-url"
                                                    rel="author"
                                                    href={author.url ||
                                                        siteConfig.url}
                                                    >{author.name}</a
                                                >
                                            </span>
                                        {/each}
                                        {#if systemConfig.lnurlp?.page && lightningSupported}
                                            <a
                                                class="button button-text no-print"
                                                style="padding:0; height: auto; display: inline-flex; color: gold"
                                                rel="noindex nofollow noopener external"
                                                href={systemConfig.lnurlp.page}
                                            >
                                                <IconBolt size={18} />
                                            </a>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                            <div class="article-license-meta-item">
                                <div class="label">
                                    <span lang={$locale}
                                        >{$t("common.publish_date")}</span
                                    >
                                </div>
                                <div class="value">
                                    <Time
                                        date={post.published?.date}
                                        class="dt-published"
                                        locale={$locale}
                                    />
                                </div>
                            </div>
                            {#if post.modified?.date && post.modified?.date !== post.published?.date}
                                <div class="article-license-meta-item">
                                    <div class="label">
                                        <span lang={$locale}
                                            >{$t("common.update_date")}</span
                                        >
                                    </div>
                                    <div class="value">
                                        <Time
                                            date={post.modified?.date}
                                            class="dt-updated"
                                            locale={$locale}
                                        />
                                    </div>
                                </div>
                            {/if}
                            {#if post.license || systemConfig.license?.default}
                                <div class="article-license-meta-item">
                                    <div class="label">
                                        <span lang={$locale}
                                            >{$t("common.license")}</span
                                        >
                                    </div>
                                    <div class="value">
                                        <License
                                            license={post.license ||
                                                systemConfig.license?.default}
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <details style="padding: 1rem" class="no-print">
                            <summary>
                                <span lang={$locale}>{$t("common.cite")}</span>
                            </summary>
                            <div style="padding-left: 2rem">
                                <Cite
                                    post={{
                                        title: post.title,
                                        author: post.author,
                                        date: post.published?.date,
                                        url: siteConfig.url + post.route,
                                    }}
                                    site={siteConfig.title}
                                    base={siteConfig.url}
                                />
                                <details>
                                    <summary>CFF</summary>
                                    <a rel="noindex" href="./CITATION.cff"
                                        >CITATION.cff</a
                                    >
                                </details>
                            </div>
                        </details>
                    </div>
                {/if}

                {#if post.taxonomy || (post.langs?.length || 0) > 0}
                    <div class="article-taxonomy-and-lang no-print">
                        {#if post.taxonomy}
                            <div class="article-taxonomy">
                                {#if post.taxonomy?.series?.length}
                                    <ul>
                                        {#each post.taxonomy.series as series}
                                            <li>
                                                <a
                                                    rel="tag"
                                                    class="p-series series"
                                                    href="/series/{series
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/gm,
                                                            '-',
                                                        )}/">{series}</a
                                                >
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                                {#if post.taxonomy?.category?.length}
                                    <ul>
                                        {#each post.taxonomy.category as category}
                                            <li>
                                                <a
                                                    rel="tag"
                                                    class="p-category category"
                                                    href="/category/{category
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/gm,
                                                            '-',
                                                        )}/">{category}</a
                                                >
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                                {#if post.taxonomy?.tag?.length}
                                    <ul>
                                        {#each post.taxonomy.tag as tag}
                                            <li>
                                                <a
                                                    rel="tag"
                                                    class="p-tag tag"
                                                    href="/tag/{tag
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/gm,
                                                            '-',
                                                        )}/">{tag}</a
                                                >
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        {/if}
                        {#if (post.langs?.length || 0) > 1}
                            <div class="article-lang">
                                <IconLanguage size={20} />
                                <ul>
                                    {#each post.langs || [] as lang}
                                        <li>
                                            <a
                                                rel="alternate"
                                                href="/{lang}{post.route}"
                                                {lang}>{$t(`lang.${lang}`)}</a
                                            >
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</article>

<style lang="scss">
    :global(article) {
        :global(.article-content) {
            :global(h2),
            :global(h3),
            :global(h4),
            :global(h5),
            :global(h6) {
                position: relative;

                :global(a.heading-anchor-link) {
                    --width: 1.33ch;
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    position: absolute;
                    left: calc(var(--width) * -1);
                    width: var(--width);
                    font-weight: lighter;
                }

                :global(a.heading-anchor-link::before) {
                    content: "¶";
                }

                &:hover {
                    :global(a.heading-anchor-link) {
                        visibility: visible;
                        opacity: 1;
                        text-decoration: none;
                    }
                }
            }

            :global(strong) {
                color: var(--text-color-primary);
            }
        }
    }

    :global(h2[id^="footnote-label"]) {
        font-size: 105%;
        color: var(--text-color-secondary);

        :global(~ ol) {
            font-size: 85%;
            color: var(--text-color-secondary);
        }
    }

    :global([id^="fn-"] p) {
        margin: 0.333em 0;
    }

    article {
        --article-bg-color: var(--content-bg-color);
        --article-border-radius: var(--content-border-radius);

        --article-border: var(--content-border);

        border-radius: var(--article-border-radius);

        &.type-none {
            --article-bg-color: transparent;
            --article-border: none;
        }

        @media print {
            --article-border: none;
            border-radius: 0;
        }

        .article-header,
        .article-body,
        .article-footer {
            background: var(--article-bg-color);
            border: var(--article-border);
        }

        .article-header,
        .article-body {
            border-bottom: 0;
        }

        .article-footer,
        .article-body {
            border-top: 0;
        }

        .article-header,
        .article-footer {
            overflow: hidden;
        }

        > :first-child {
            border-top-left-radius: var(--article-border-radius);
            border-top-right-radius: var(--article-border-radius);
            min-height: var(--article-border-radius);
        }

        > :last-child {
            border-bottom-left-radius: var(--article-border-radius);
            border-bottom-right-radius: var(--article-border-radius);
            min-height: var(--article-border-radius);
        }

        .article-body {
            position: relative;
        }

        .article-aside {
            position: absolute;
            margin-left: 100%;
            height: 100%;

            &.article-aside-left {
                top: 0;
                transform: translateX(-100%);
                margin-left: unset;

                aside {
                    align-items: end;
                    top: 50svh;
                    transform: translateY(-100%);
                }
            }

            aside {
                position: sticky;
                top: 0;
                min-width: calc((100vw - 54rem) / 2 - var(--content-padding));

                display: flex;
                flex-direction: column;
                gap: 2rem;

                .article-toc {
                    a {
                        color: var(--text-color-tertiary);
                    }
                    :global(a.current) {
                        font-weight: bold;
                        color: var(--text-color-primary);
                    }
                    h3 {
                        display: inline-block;
                    }
                }
                #toc-button {
                    display: none;
                }
            }
        }

        h1,
        .article-meta {
            text-align: center;
        }

        h1 {
            padding: var(--content-padding) var(--content-padding) 0.5rem
                var(--content-padding);
            margin: 0;
        }

        .article-meta {
            color: var(--text-color-tertiary);

            display: flex;
            gap: 1em;
            justify-content: center;

            &:is(:first-child) {
                margin-top: 2rem;
            }
        }
        .article-aside aside {
            padding: 0 var(--content-padding);

            @media screen {
                :global(> *:first-child) {
                    margin-top: var(--content-padding);
                }
            }

            @media print {
                padding: 0;
            }
        }
        .article-content {
            padding: var(--content-padding);

            @media screen {
                :global(> *:first-child) {
                    margin-top: 0;
                }
            }

            @media print {
                padding: 0;
            }
        }

        @media screen {
            .article-toc {
                h3 {
                    margin-top: 0;
                }
            }
        }

        .article-extra {
            display: flex;
            flex-flow: column;
            flex-wrap: wrap;

            ul {
                display: flex;
                gap: 1rem;
                padding-left: 0;
                margin: 0;
                flex-wrap: wrap;
            }

            li {
                list-style: none;
            }

            > :nth-child(odd) {
                background-color: var(--pane-bg-color);
            }

            > :nth-child(even) {
                background: unset;
            }

            .article-license {
                padding: 1rem var(--content-padding);
                display: flex;
                gap: 1rem;
                flex-flow: column;
                color: var(--text-color-secondary);

                a {
                    color: unset;
                }
                a.link {
                    font-size: 80%;
                    text-decoration: underline;
                    color: var(--text-color-tertiary);
                }

                .article-license-meta {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .article-license-meta-item {
                    .label {
                        font-size: 80%;
                        color: var(--text-color-tertiary);
                    }
                }
            }

            .article-taxonomy-and-lang {
                display: flex;
                justify-content: space-between;

                @media screen and (max-width: 600px) {
                    flex-flow: column;
                }
            }

            .article-taxonomy {
                display: flex;
                gap: 2rem;
                flex-wrap: wrap;
                padding: 1rem var(--content-padding);

                a {
                    color: var(--text-color-tertiary);
                }

                .series::before {
                    content: "+";
                }
                .category::before {
                    content: "/";
                }
                .tag::before {
                    content: "#";
                }
            }

            .article-lang {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                align-items: center;
                padding: 1rem var(--content-padding);

                a {
                    color: var(--text-color-tertiary);
                    font-size: 1rem;
                }
            }
        }
    }

    @media screen and (max-width: 600px) {
        h3 {
            padding-left: var(--content-padding);
        }
    }

    @media screen and (max-width: 1600px) {
        article {
            .article-aside {
                position: static;
                margin-left: 0;
                height: auto;

                aside {
                    position: static;
                    min-width: unset;
                }

                &.article-aside-left {
                    transform: none;
                    aside {
                        align-items: end;
                        top: 0;
                        transform: none;
                    }
                }

                #toc-button {
                    display: flex !important;
                    position: fixed;
                    right: 1rem;
                    bottom: 7rem;
                    z-index: 1000;
                }

                #comments-link {
                    position: fixed;
                    right: 1rem;
                    bottom: 4rem;
                    z-index: 1000;
                }
            }
        }
    }
</style>
