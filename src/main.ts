import { Application } from "./application";
import { log } from "./logging/log.js";

process.on("uncaughtException", (e) => {
    handleError(e);
});

process.on("unhandledRejection", (e) => {
    if (e instanceof Error) {
        handleError(e);
    } else {
        handleError(new Error(String(e)));
    }
});

main();

function handleError(error: Error) {
    log(`\nFATAL ERROR:\n{error.message}\n`);
    log(`Stack trace:\n${error.stack}`);
    process.exit(1);
}

function main() {
    const app = new Application();
    app.start();
}