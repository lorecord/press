import chokidar from "chokidar";
import debounce from "lodash.debounce";

let tasks: any;

function watch(path: string, callback: Function) {
    const debouncedHandleChange = debounce((event: any, path: string) => {
        console.debug(`chokidar: ${event} ${path}`);
        callback(event, path);
    }, 5000);

    chokidar.watch(path, {
        ignored: /(^|[\/\\])\../,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
    }).on('all', (event, path) => {
        debouncedHandleChange(event, path);
    });

    return { path };
}

export function fileWatch(path: string, callback: Function, task: string | undefined) {
    task = task || 'default';
    tasks = tasks || {};

    tasks[task] = tasks[task] || (() => {
        console.debug(`watching file for ${task}:`, path);
        return watch(path, callback);
    })();
}