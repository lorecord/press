import { browser } from "$app/environment";

export const browerContext: {
    handled: {
        [key: string]: boolean
    }
} = {
    handled: {}
};

export const awaitChecker = (key: string = 'default') => {
    if (!browser) {
        return true;
    }
    if (!browerContext.handled[key]) {
        browerContext.handled[key] = true;
        return true;
    }
    return false;
}