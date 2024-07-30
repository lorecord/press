import { browser } from "$app/environment";

export const browerContext = {
    handled: false
};

export const awaitChecker = () => {
    if (!browser) {
        return true;
    }
    if (!browerContext.handled) {
        browerContext.handled = true;
        return true;
    }
    return false;
}