class Logger {
    static log(...args: any[]) {
        console.log(...args);
    }
}

export function log(...args: any[]) {
    Logger.log(...args);
}