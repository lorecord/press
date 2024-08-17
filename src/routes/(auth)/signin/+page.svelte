<script lang="ts">
    import { enhance } from "$app/forms";
    import { t } from "$lib/translations";
    import { loading } from "$lib/ui/actions/button";
    import type { ActionData, SubmitFunction } from "./$types";

    let signingIn = false;
    export let form: ActionData;

    const handleEnhanceSubmit: SubmitFunction = ({}) => {
        signingIn = true;

        return async ({ result,update }) => {
            signingIn = false;
            update();
        };
    };
</script>

<form
    method="post"
    class="auth-form loadable"
    action="/signin"
    use:loading={signingIn}
    use:enhance={handleEnhanceSubmit}
>
    {#if form?.error}
        <div class="alert alert-error">
            {form.error}
        </div>
    {/if}
    <div class="form-row">
        <label>
            <input
                type="text"
                name="username"
                value={form?.username ?? ""}
                placeholder={$t("auth.username")}
                required
            />
            <div class="label">
                {$t("auth.username")}
            </div>
        </label>
    </div>
    <div class="form-row">
        <label>
            <input
                type="password"
                name="password"
                required
                placeholder={$t("auth.password")}
            />
            <div class="label">
                {$t("auth.password")}
            </div>
        </label>
    </div>
    <div
        class="form-row"
        style="justify-content: space-between; align-items: center;"
    >
        <span style="color: var(--text-color-secondary);font-size: 67%"
            >{$t("auth.auth_tips")}</span
        >
        <button
            type="submit"
            class="button-xs-block button-thin button-pill"
            use:loading={signingIn}>{$t("auth.signin")}</button
        >
    </div>
</form>

<style lang="scss">
    .auth-form {
        max-width: 600px;
        min-width: 300px;
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }

    .form-row {
        display: flex;
        flex-flow: row;
        gap: 0.5rem;

        @media screen and (max-width: 600px) {
            flex-flow: column-reverse;
            align-items: unset !important;
        }
    }
</style>
