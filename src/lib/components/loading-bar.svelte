<script lang="ts">
    let progress = 0;
    let visible = true;

    export function start() {
        update(30);
    }

    export function update(progressValue: number) {
        if (progress > 0 && progress < 100) {
            visible = true;
        }
        progress = progressValue;

        if (progressValue >= 100) {
            setTimeout(() => {
                visible = false;
                setTimeout(() => {
                    progress = 0;
                }, 500);
            }, 500);
        }
    }

    export function finish() {
        update(100);
    }
</script>

<div
    class="loading-bar"
    style="width: {progress}%; opacity: {visible ? 1 : 0}"
></div>

<style lang="scss">
    .loading-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background-color: #2a99ee;
        transition:
            width 0.4s ease-in,
            opacity 0.4s ease-out;
        z-index: 10;
    }
</style>
