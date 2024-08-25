import { RateLimiter } from "./rate-limit";

export const rateLimiter = new RateLimiter({
    limit: 1000,
    period: 60 * 1000
});