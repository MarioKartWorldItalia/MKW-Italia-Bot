import { Application } from "./application";
import { log } from "./logging/log.js";
import express, { application } from "express"
import dotenv from "dotenv"
import { Globals } from "./globals";

function handleError(error: Error) {
    log(`\nFATAL ERROR:\n${error.message}`);
    log(`Stack trace:\n${error.stack}`);
    process.exit(1);
}

async function main() {

    process.on("uncaughtException", (e) => {
        log("ERROR: uncaughtException");
        handleError(e);
    });

    process.on("unhandledRejection", (e) => {
        log("ERROR: unhandledRejection");
        if (e instanceof Error) {
            handleError(e);
        } else {
            handleError(new Error(String(e)));
        }
    });

    process.on("exit", (exitCode) => { console.log("Exiting process with code " + exitCode); });

    process.on("SIGTERM", (_) => processTermination(app, "SIGTERM"));
    process.on("SIGINT", (_) => processTermination(app, "SIGINT"));

    const app = new Application();
    Application.setInstance(app);
    app.start();
}

function processTermination(app: Application, signal: string) {
    log(`Received ${signal}. Cleaning up...`);
    app.shutdown().then(() => {
        log("Cleanup complete. Exiting...");
        process.exit(0);
    }).catch((error) => {
        log(`Error during cleanup: ${error.message}`);
        process.exit(1);
    });
}

//-------------ENTRY POINT----------------
main();
//----------------------------------------