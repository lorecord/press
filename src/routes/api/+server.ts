import { error } from "@sveltejs/kit";

export function GET({ request }) {
    error(404);
}