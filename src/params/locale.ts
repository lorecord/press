/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param: string) {
    return /^\w{2,3}(-\w{2,6})?$/.test(param);
}