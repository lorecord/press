<script lang="ts">
    import spdxLicenseList from "spdx-license-list";

    export let license: string;

    function getLicense(name: string): any {
        return spdxLicenseList[name] || matchLicense(name);
    }

    function matchLicense(name: string): { name: string; url?: string } {
        if (license === "CC-BY-NC-SA") {
            return {
                name: "CC BY-NC-SA 4.0",
                url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
            };
        }
        if (license === "CC-BY-NC") {
            return {
                name: "CC BY-NC-SA 4.0",
                url: "https://creativecommons.org/licenses/by-nc/4.0/",
            };
        } else if (license === "CC-BY-ND") {
            return {
                name: "CC BY-ND 4.0",
                url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            };
        } else if (license === "CC-NC-SA") {
            return {
                name: "CC NC-SA 4.0",
                url: "https://creativecommons.org/licenses/nc-sa/4.0/",
            };
        } else if (license === "CC-BY") {
            return {
                name: "CC BY 4.0",
                url: "https://creativecommons.org/licenses/by/4.0/",
            };
        } else if (license === "CC-BY-SA") {
            return {
                name: "CC BY-SA 4.0",
                url: "https://creativecommons.org/licenses/by-sa/4.0/",
            };
        } else if (license === "CC-BY-NC-ND") {
            return {
                name: "CC BY-NC-ND 4.0",
                url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            };
        } else if (license === "WTFPL") {
            return {
                name: "WTFPL",
                url: "http://www.wtfpl.net/",
            };
        } else {
            console.log("Unknown license: " + license);
            return { name: license };
        }
    }

    $: ({ name, url } = getLicense(license));
</script>

{#if url}
    <a href={url} rel="external">{name}</a>
{:else}
    <span>{name}</span>
{/if}

<style lang="scss">
    a {
        color: var(--color-text-tertiary);
    }
</style>
