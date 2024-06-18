import { cpus } from 'os';
import { Worker } from "worker_threads";
import path from 'path';

const cpuNum = cpus().length;

interface Task {
    data: any;
    callback: (error: any, message: any) => void;
}
export class WorkerPool {
    workerPath: string;
    threads: number;
    private _queue: Task[];
    private _workers: {
        [x: number]: Worker;
    };
    private _active: {
        [x: number]: boolean;
    };

    constructor(workerPath: string, threads: number = cpuNum) {
        if (threads < 1) {
            threads = 1;
        }
        this.workerPath = workerPath;
        this.threads = threads;
        this._queue = [];
        this._workers = {};
        this._active = {};

        for (let i = 0; i < threads; i++) {
            this._workers[i] = new Worker(workerPath);
            this._active[i] = false;
        }
    }

    getInactiveWorkerId() {
        for (let i = 0; i < this.threads; i++) {
            if (!this._active[i]) {
                return i;
            }
        }
        return -1;
    }

    runWorker(workerId: number, task: Task) {
        const worker = this._workers[workerId];

        const doAfterTaskFinished = () => {
            worker.removeAllListeners('message');
            worker.removeAllListeners('error');
            this._active[workerId] = false;

            ((taskFromQueue) => {
                if (taskFromQueue) {
                    this.runWorker(workerId, taskFromQueue);
                }
            })(this._queue.shift());
        }

        this._active[workerId] = true;

        const messageCallback = (message: any) => {
            task.callback(null, message);
            doAfterTaskFinished();
        }

        const errorCallback = (error: any) => {
            task.callback(error, null);
            doAfterTaskFinished();
        }

        worker.once('message', messageCallback);
        worker.once('error', errorCallback);

        worker.postMessage(task.data);
    }

    run(data: any) {
        return new Promise((resolve, reject) => {
            const workerId = this.getInactiveWorkerId();
            if (workerId > -1) {
                this.runWorker(workerId, {
                    data,
                    callback: (error: any, message: any) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(message);
                        }
                    }
                });
            } else {
                this._queue.push({
                    data,
                    callback: (error, message) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(message);
                        }
                    }
                });
            }
        });
    }

    destroy() {
        for (let i = 0; i < this.threads; i++) {
            this._workers[i].terminate();
        }
    }
}

let workerPools: {
    [key: string]: WorkerPool;
}

export function getWorkerPool(workerName: string) {
    if (!workerPools) {
        workerPools = {};
    }
    if (!workerPools[workerName]) {
        workerPools[workerName] = new WorkerPool(path.resolve(`./src/lib/server/worker/${workerName}.worker.js`));
    }
    return workerPools[workerName];
}