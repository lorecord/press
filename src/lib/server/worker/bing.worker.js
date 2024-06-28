import { parentPort } from 'worker_threads';

parentPort?.on("message", (message) => {
    const { site, posts } = message;
    parentPort?.postMessage("bing worker done!");
});