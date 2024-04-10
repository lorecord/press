<script lang="ts">
    export let value = 0;
    export let show: boolean = false;
    export let count = 0;
    export let max = 10;
    export let starMax = 5;

    $: starNum = (value / max) * starMax;
</script>

<div class="rating" data-rating={value}>
    {#if show}
        <span class="label">{value}</span>
    {/if}
    <span class="stars">
        {#each Array.from({ length: starMax }, (_, i) => i + 1) as star}
            <span
                class:star={starNum > star - 0.34}
                class:half={starNum <= star - 0.34 && starNum >= star - 0.67}
                class:empty={starNum < star - 0.51}
                >{#if starNum >= star}<span class="a">&#9733;</span><span
                        class="b">&#9733;</span
                    >{:else if starNum >= star - 0.5}<span class="b"
                        >&#9733;</span
                    ><span class="a">&#9734;</span>{:else}<span class="b"
                        >&#9734;</span
                    ><span class="a">&#9734;</span>{/if}</span
            >
        {/each}
    </span>
    {#if count > 0}
        <span class="count">({count})</span>
    {/if}
</div>

<style lang="scss">
    .rating {
        display: inline-block;

        .b {
            opacity: 0;
            position: absolute;
        }

        .label {
            color: gold;
        }

        .star {
            color: gold;
        }

        .half,
        .empty {
            color: var(--text-color-tertiary);
        }

        .half {
            position: relative;
            display: inline-block;

            &::before {
                content: "\2605";
                position: absolute;
                width: 50%;
                overflow: hidden;
                color: gold;
                background-color: var(--content-bg-color);
                display: inline-block;
            }
        }
    }

    @media (prefers-color-scheme: dark) {
        .rating {
            .half {
                &::before {
                    background-color: unset;
                }
            }
        }
    }
</style>
