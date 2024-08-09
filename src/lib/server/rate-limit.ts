export type RateLimitBucket = {
    [key: string]: {
        water: number,
        last: number,
        capacity: number
    }
};

export class RateLimiter {
    private logs: RateLimitBucket;
    private limit: number;
    private duration: number;

    constructor({ limit, duration }: { limit: number, duration: number }) {
        this.logs = {};
        this.limit = limit;
        this.duration = duration;
    }

    static create(limit: number, duration: number) {
        return new RateLimiter({ limit, duration });
    }

    inflood(key: string,volume: number = 1) {
        const now = Date.now();

        const bucket = this.get(key);

        const timeElapsed = now - bucket.last;

        const leaked = bucket.capacity - bucket.capacity * Math.exp(- timeElapsed / this.duration);

        bucket.water = Math.max(0, bucket.water - leaked);

        bucket.last = now;

        if (bucket.water < this.limit) {
            bucket.water += volume;
            return true;
        }

        return false;
    }

    get(key: string) {
        this.logs[key] = this.logs[key] || {
            water: 0,
            last: Date.now(),
            capacity: this.limit
        };

        const bucket = this.logs[key];
        return bucket;
    }
}