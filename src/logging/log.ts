class Logger {
    static log(...args: any[]) {
        console.log(...args);
    }

    static logError(...args: any[]) {
        console.error(...args);
    }
}

export function log(...args: any[]) {
    Logger.log(...args);
}

export function logError(...args: any[]) {
    Logger.log(...args);
}