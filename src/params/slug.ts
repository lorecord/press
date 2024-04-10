/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param) {
    return /^[\w-_]+$/.test(param);
}