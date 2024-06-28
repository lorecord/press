<script lang="ts">
    import { formatToHTMLStyleFromObject } from "../utils";

    export let date: Date | string;
    export let locale: string;
    export let options: Intl.DateTimeFormatOptions = {
        dateStyle: "short",
        timeStyle: "short",
    };
</script>

<time
    class={$$props.class}
    style={formatToHTMLStyleFromObject($$props.style)}
    datetime={new Date(date).toISOString()}
>
    {new Intl.DateTimeFormat(locale, options).format(new Date(date))}
</time>
