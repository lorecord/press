import type { ParamMatcher } from "@sveltejs/kit";

export const match: ParamMatcher = (param: string) => {
    return /^\w{2,3}(-\w{2,6})?$/.test(param);
}