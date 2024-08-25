export type BucketData = {
    water: number,
    last: number,
    capacity: number
};

export type RateLimitBuckets = {
    [key: string]: BucketData
};

export class Bucket {
    private data: BucketData;
    private period: number;

    constructor(data: BucketData, period: number) {
        this.data = data;
        this.period = period;
    }

    get water() {
        let now = Date.now();
        const timeElapsed = now - this.data.last;
        const maxLeakRate = this.data.capacity * (1 - Math.exp(-1 / this.period));
        const leaked = Math.min(this.data.water * (1 - Math.exp(- timeElapsed / this.period)), maxLeakRate * timeElapsed);
        this.data.water = Math.max(0, this.data.water - leaked);
        this.data.last = now;
        return this.data.water;
    }

    get capacity() {
        return this.data.capacity;
    }

    set water(water: number) {
        this.data.water = water;
    }

    get last() {
        return this.data.last;
    }

    getResetDuration() {
        const target = this.data.capacity * 0.2;
        let duration = 0;
        let remaining = this.data.water;

        if (remaining > target) {
            if (this.data.water > this.data.capacity) {
                const maxLeakRate = this.data.capacity * (1 - Math.exp(-1 / this.period));
                duration += (this.data.water - this.data.capacity) / maxLeakRate;
                remaining = this.data.capacity;
            }

            if (remaining > target) {
                duration += -this.period * Math.log(target / remaining);
            }
        }
        return duration;
    }

    reset() {
        this.data.water = 0;
    }
}

export class RateLimiter {
    readonly logs: RateLimitBuckets;
    private limit: number;
    private period: number;

    /**
     * @param limit - The maximum number of requests that can be made in the period
     * @param period - The time period in milliseconds
     */
    constructor(options: {
        /** The maximum number of requests that can be made in the period */
        limit: number,
        /** The time period in milliseconds */
        period: number,
        logs?: RateLimitBuckets
    }) {
        const { limit, period, logs = {} } = options;
        this.logs = logs;
        this.limit = limit;
        this.period = period;
    }

    available(key: string) {
        return this.get(key).water <= this.limit;
    }

    inflood(key: string, volume: number | ((limit: number, water: number) => number) = 1) {
        const bucket = this.get(key);

        if (bucket.water <= this.limit) {
            bucket.water += (typeof volume === 'function') ? volume(this.limit, bucket.water) : volume;
        } else {
            bucket.water += 1;
        }

        return bucket.water <= this.limit;
    }

    get(key: string) {
        this.logs[key] = this.logs[key] || {
            water: 0,
            last: Date.now(),
            capacity: this.limit
        };
        const data = this.logs[key];
        return new Bucket(data, this.period);
    }

    reset(key: string) {
        delete this.logs[key];
    }
}