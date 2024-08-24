import { RateLimiter } from "./rate-limit";

export const rateLimiter = new RateLimiter({
    limit: 1000,
    duration: 60 * 1000
});