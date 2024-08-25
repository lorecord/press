import { RateLimiter, type RateLimitBuckets } from "./rate-limit";
import fs from 'fs';
import YAML from 'yaml';
import { env } from "$env/dynamic/private";

let logs: RateLimitBuckets = {};

async function load(filePath: string) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`No file found for ${filePath}.`);
            return {};
        }
        let file = fs.readFileSync(filePath, 'utf8');
        return YAML.parse(file);
    } catch (err) {
        console.error('Error loading object from file:', err);
        return {};
    }
}

async function save(filePath: string) {
    try {
        const data = YAML.stringify(logs);
        fs.writeFileSync(filePath, data, 'utf-8');
        console.log('Saved object to file');
    } catch (err) {
        console.error('Error saving object to file:', err);
    }
}
const filePath = env.RATE_LIMIT_FILE;
filePath && await load(filePath);

if (filePath) {
    setInterval(() => {
        save(filePath);
    }, 60000);
}

export const rateLimiter = new RateLimiter({
    limit: 1000,
    period: 60 * 1000,
    logs
});

