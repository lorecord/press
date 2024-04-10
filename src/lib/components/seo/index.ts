import Title from "$lib/components/seo/title.svelte";
import DescriptionMeta from "$lib/components/seo/description-meta.svelte";
import SveltekitSeo from "./all.svelte";

export { Title, DescriptionMeta, SveltekitSeo };

export function dateToString(date: string | Date) {
    return new Date(date).toISOString();
}
