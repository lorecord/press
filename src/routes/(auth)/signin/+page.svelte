<script lang="ts">
    import { t } from "$lib/translations";
</script>

<form method="post" class="auth-form" action="/login">
    <div class="form-row">
        <label>
            <input
                type="text"
                name="username"
                placeholder={$t("auth.username")}
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
        <span style="color: var(--text-color-secondary)"
            >{$t("auth.auth_tips")}</span
        >
        <button
            type="submit"
            class="button-xs-block"
            style="padding-left: 3rem; padding-right: 3rem"
            >{$t("auth.signin")}</button
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
    }
</style>
