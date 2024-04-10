/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param: string) {
    return /^([\w-_]+)(\/[\w-_]+)*\/?$/.test(param);
}