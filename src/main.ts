import { Application } from "./application";
import { log } from "./logging/log.js";
import express from "express"

function handleError(error: Error) {
    log(`\nFATAL ERROR:\n{error.message}\n`);
    log(`Stack trace:\n${error.stack}`);
    process.exit(1);
}

function main() {
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

    process.on("exit", (exitCode) => { console.log("Exiting process with code " + exitCode); });

    const app = new Application();

    const server = express();
    server.get("/ping", (req, res) => { res.send("pong") });
    server.listen(process.env.PORT, () => { log("Webserver started on port: " + process.env.PORT); });

    app.start();
}

//-------------ENTRY POINT----------------
main();
//----------------------------------------