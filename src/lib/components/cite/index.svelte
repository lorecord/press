<script lang="ts">
    export let data:
        | {
              authors: any[] | any;
              title: string;
              date: string | Date;
              url: string;
              siteTitle: string;
          }
        | any = {};

    $: ({ authors: _authors, title, date: _date, url, siteTitle } = data);
    $: date = new Date(_date);
    $: authors = [_authors].flat();
    $: authorsString = authors
        .map((author) => author?.name || author)
        .join(", ");
    $: isoDateString = date.toISOString().split("T")[0];
</script>

<details>
    <summary>APA</summary>
    <pre>{`${authorsString}. (${isoDateString}). ${siteTitle}. ${title} [Blog post]. ${url}`}</pre>
</details>
<details>
    <summary>MLA</summary>
    <pre>{`${authorsString}. "${title}." ${siteTitle}, ${isoDateString} ${url}. Accessed ${new Date().toISOString().split("T")[0]}`}</pre>
</details>
<details>
    <summary>Chicago (CMS)</summary>
    <pre>{`${authorsString}. "${title}." ${siteTitle} (Blog), ${isoDateString} ${url}`}</pre>
</details>
<details>
    <summary>Harvard</summary>
    <pre>{`${authorsString}. (${new Date(date).getFullYear()}). ${title}. ${siteTitle}. ${url}`}</pre>
</details>
<details>
    <summary>Vancouver</summary>
    <pre>{`${authorsString}. ${title}. ${siteTitle} [Internet]. ${isoDateString}; Available from: ${url}`}</pre>
</details>
<details>
    <summary>Bibtex</summary>
    <pre>{`@online{${authorsString}_${new Date(date).getFullYear()}_${title},
author  = {${authorsString}},
title   = {{${title}}},
journal = {${siteTitle}},
type    = {Blog},
doi     = {${url}},
urldate = {${new Date().toISOString().split("T")[0]}},
date    = {${isoDateString}},
year    = {${date.getFullYear()}},
month   = {${date.getMonth()}},
day     = {${date.getDate()}}
}`}</pre>
</details>
