<script lang="ts">
    export let post:
        | {
              authors: any[] | any;
              title: string;
              date: string | Date;
              url: string;
          }
        | any = {};

    export let site: string;
    export let base: string = "";

    $: ({ authors: _authors, title, date: _date, url: _url } = post);
    $: date = new Date(_date);
    $: url = base + _url;
    $: authors = [_authors].flat();
    $: authorsString = authors
        .map((author) => author?.name || author?.account)
        .join(", ");
    $: isoDateString = date.toISOString().split("T")[0];
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
    <pre>{`${authorsString}. (${new Date(date).getFullYear()}). ${title}. ${site}. ${url}`}</pre>
</details>
<details>
    <summary>Vancouver</summary>
    <pre>{`${authorsString}. ${title}. ${site} [Internet]. ${isoDateString}; Available from: ${url}`}</pre>
</details>
<details>
    <summary>Bibtex</summary>
    <pre>{`@online{${authorsString}_${new Date(date).getFullYear()}_${title},
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
