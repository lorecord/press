<script lang="ts">
    import { t } from "$lib/translations";
    import { loading } from "$lib/ui/actions/button";

    let signingIn = false;

    function handleLogin(event: Event) {
        console.log("Login form submitting");
        event.preventDefault();
        signingIn = true;
        console.log("Login form submitted");

        setTimeout(() => {
            signingIn = false;
        }, 5000);
    }
</script>

<form
    method="post"
    class="auth-form loadable"
    action="/login"
    on:submit|preventDefault={handleLogin}
    use:loading={signingIn}
>
    <div class="form-row">
        <label>
            <input
                type="text"
                name="username"
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
        }
    }
</style>
