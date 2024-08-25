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
        this.data.water = Math.max(0, this.data.water * Math.exp(- timeElapsed / this.period));
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
        const target = this.data.capacity / 2;
        if (this.data.water <= target) {
            return 0;
        }
        const duration = -this.period * Math.log(target / this.data.water)
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
    constructor({ limit, period }: {
        /** The maximum number of requests that can be made in the period */
        limit: number,
        /** The time period in milliseconds */
        period: number
    }) {
        this.logs = {};
        this.limit = limit;
        this.period = period;
    }

    inflood(key: string, volume: number | ((limit: number, water: number) => number) = 1) {
        const bucket = this.get(key);

        bucket.water += (typeof volume === 'function') ? volume(this.limit, bucket.water) : volume;

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