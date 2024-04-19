import Worker from 'worker_threads';

let worker;

function getWorker() {
    if (!worker) {
        worker = new Worker('./press.js');
        worker.on("message", (message) => {
            console.log("Received message from worker:", message);
        });
        worker.on("error", (error) => {
            console.error("Error from worker:", error);
        });
        worker.on("exit", (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
            worker = null;
        });
    }
    return worker;
}

module.exports = { getWorker };