<script lang="ts">
    import type { ContactBaseProfile } from "$lib/types";

    export let post: {
        author?: ContactBaseProfile[];
        title: string;
        date: string;
        url: string;
    } = {} as any;

    export let site: string;

    $: ({ author, title, date: _date, url } = post);
    $: date = new Date(_date);
    $: authorsString = author
        ?.map((author: ContactBaseProfile) => author?.name)
        .join(", ");
    $: isoDateString = new Date(date).toISOString().split("T")[0];
</script>

<details>
    <summary>APA</summary>
    <pre>{`${authorsString}. (${isoDateString}). ${site}. ${title} [Blog post]. ${url}`}</pre>
</details>
<details>
    <summary>MLA</summary>
    <pre>{`${authorsString}. "${title}." ${site}, ${isoDateString} ${url}. Accessed ${new Date().toISOString().split("T")[0]}`}</pre>
</details>
<details>
    <summary>Chicago (CMS)</summary>
    <pre>{`${authorsString}. "${title}." ${site} (Blog), ${isoDateString} ${url}`}</pre>
</details>
<details>
    <summary>Harvard</summary>
    <pre>{`${authorsString}. (${date.getFullYear()}). ${title}. ${site}. ${url}`}</pre>
</details>
<details>
    <summary>Vancouver</summary>
    <pre>{`${authorsString}. ${title}. ${site} [Internet]. ${isoDateString}; Available from: ${url}`}</pre>
</details>
<details>
    <summary>Bibtex</summary>
    <pre>{`@online{${authorsString}_${date.getFullYear()}_${title},
author  = {${authorsString}},
title   = {{${title}}},
journal = {${site}},
type    = {Blog},
doi     = {${url}},
urldate = {${new Date().toISOString().split("T")[0]}},
date    = {${isoDateString}},
year    = {${date.getFullYear()}},
month   = {${date.getMonth()}},
day     = {${date.getDate()}}
}`}</pre>
</details>
