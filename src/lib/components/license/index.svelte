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
        console.log("Unknown license: " + license);
        return { licenseId: license };
    }

    $: ({ licenseId, name, url } = getLicense(license));
</script>

{#if url}
    <a href={url} rel="external license" title={name}>{licenseId}</a>
{:else}
    <abbr title={name}>{licenseId}</abbr>
{/if}

<style lang="scss">
    a {
        color: var(--color-text-tertiary);
    }
</style>
