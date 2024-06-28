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
    <div>
        <button type="submit">{$t("auth.signin")}</button>
    </div>
</form>

<style lang="scss">
    .auth-form {
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
