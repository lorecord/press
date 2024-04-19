import { parentPort } from 'worker_threads';

parentPort?.on("message", (message) => {
    console.log("Received message from parent:", message);
    parentPort?.postMessage("Hello from worker!");
});