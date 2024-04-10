<script lang="ts">
    import spdxLicenseList from "spdx-license-list";

    export let license: string;

    function getLicense(license: string): any {
        if (spdxLicenseList[license]) {
            return { licenseId: license, ...spdxLicenseList[license] };
        }
        return matchLicense(name);
    }

    function matchLicense(name: string): {
        licenseId: string;
        name?: string;
        url?: string;
    } {
        if (license === "CC-BY-NC-SA") {
            return {
                licenseId: "CC BY-NC-SA 4.0",
                url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
            };
        }
        if (license === "CC-BY-NC") {
            return {
                licenseId: "CC BY-NC-SA 4.0",
                url: "https://creativecommons.org/licenses/by-nc/4.0/",
            };
        } else if (license === "CC-BY-ND") {
            return {
                licenseId: "CC BY-ND 4.0",
                url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            };
        } else if (license === "CC-NC-SA") {
            return {
                licenseId: "CC NC-SA 4.0",
                url: "https://creativecommons.org/licenses/nc-sa/4.0/",
            };
        } else if (license === "CC-BY") {
            return {
                licenseId: "CC BY 4.0",
                url: "https://creativecommons.org/licenses/by/4.0/",
            };
        } else if (license === "CC-BY-SA") {
            return {
                licenseId: "CC BY-SA 4.0",
                url: "https://creativecommons.org/licenses/by-sa/4.0/",
            };
        } else if (license === "CC-BY-NC-ND") {
            return {
                licenseId: "CC BY-NC-ND 4.0",
                url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            };
        } else if (license === "WTFPL") {
            return {
                licenseId: "WTFPL",
                url: "http://www.wtfpl.net/",
            };
        } else {
            console.log("Unknown license: " + license);
            return { licenseId: license };
        }
    }

    $: ({ licenseId, name, url } = getLicense(license));
</script>

{#if url}
    <a href={url} rel="external" title={name}>{licenseId}</a>
{:else}
    <abbr title={name}>{licenseId}</abbr>
{/if}

<style lang="scss">
    a {
        color: var(--color-text-tertiary);
    }
</style>
