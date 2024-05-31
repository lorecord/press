<script lang="ts">
    import type { Data } from "../types";

    export let data: Data = {};

    $: ({
        title,
        description,
        image,
        author,
        type,
        article,
        canonical,
        reviewed,
        aggregateRating,
    } = data);

    $: ldjson = () => {
        let obj: any = {
            "@context": "https://schema.org",
            "@type": {
                article: "Article",
                website: "Webpage",
                default: "Webpage",
            }[type || "default"],
            headline: title,
        };
        if (author) {
            obj.author = {
                "@type": "Person",
                name: author,
            };
        }
        if (canonical) {
            obj.url = canonical;
        }
        if (image) {
            obj.image = image;
        }
        if (article?.published_time) {
            obj.datePublished = new Date(article.published_time).toISOString();
        }
        if (article?.modified_time) {
            obj.dateModified = new Date(article.modified_time).toISOString();
        }
        if (description) {
            obj.description = description;
        }
        if (reviewed) {
            obj.itemReviewed = {
                "@type": reviewed.item.type,
                ...reviewed.item,
            };
            obj.rating = {
                "@type": "Rating",
                ratingValue: reviewed.rating.value,
                bestRating: reviewed.rating.best || 10,
                worstRating: reviewed.rating.worst || 1,
            };
            obj.reviewBody = reviewed.body || description;
        }

        if (aggregateRating) {
            obj.aggregateRating = {
                "@type": "AggregateRating",
                ratingValue: aggregateRating.value,
                reviewCount: aggregateRating.count,
                bestRating: aggregateRating.best || 10,
                worstRating: aggregateRating.worst || 1,
            };
        }
        return Object.assign({}, obj);
    };
</script>

<svelte:head>
    {@html `<script type="application/ld+json">${JSON.stringify(
        ldjson(),
    )}</script>`}
</svelte:head>
