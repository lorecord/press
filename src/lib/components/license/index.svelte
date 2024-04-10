<script lang="ts">
    export let license: string;

    function queryLicense(name: string): any {
        if (license === "CC-BY-NC-SA") {
            return {
                name: "CC BY-NC-SA 4.0",
                link: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
            };
        }if (license === "CC-BY-NC") {
            return {
                name: "CC BY-NC-SA 4.0",
                link: "https://creativecommons.org/licenses/by-nc/4.0/",
            };
        } else if (license === "CC-BY-ND") {
            return {
                name: "CC BY-ND 4.0",
                link: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            };
        } else if (license === "CC-NC-SA") {
            return {
                name: "CC NC-SA 4.0",
                link: "https://creativecommons.org/licenses/nc-sa/4.0/",
            };
        } else if (license === "CC-BY") {
            return {
                name: "CC BY 4.0",
                link: "https://creativecommons.org/licenses/by/4.0/",
            };
        } else if (license === "CC-BY-SA") {
            return {
                name: "CC BY-SA 4.0",
                link: "https://creativecommons.org/licenses/by-sa/4.0/",
            };
        } else if (license === "CC-BY-NC-ND") {
            return {
                name: "CC BY-NC-ND 4.0",
                link: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            };
        } else if (license === "WTFPL") {
            return {
                name: "WTFPL",
                link: "http://www.wtfpl.net/",
            };
        } else {
            console.log("Unknown license: " + license);
            return { name: license };
        }
    }

    $: data = queryLicense(license);

    // TODO switch to spdx license list
</script>

{#if data.link}
    <a href={data.link} rel="external">{data.name}</a>
{:else}
    <span>{license}</span>
{/if}

<style lang="scss">
    a {
        color: var(--color-text-tertiary);
    }
</style>
