import { Application } from "./application";
import { log, logError } from "./log.js";
import express, { application } from "express"
import dotenv from "dotenv"
import { Globals } from "./globals";
import { FeatureFlagKeys, FeatureFlagsManager } from "./feature_flags_manager";

function handleError(error: Error) {
    logError(`\nFATAL ERROR:\n${error.message}`
        +`\n\nStack trace:\n${error.stack}`
    ).catch(console.error);
    FeatureFlagsManager.getBooleanValueFor(FeatureFlagKeys.ExitOnUnhandledError, true)
    .then((val) => {
        if(val) {
            process.exit(1);
        }
    })
    .catch((e)=> {
        logError(`Error retrieving feature flag value: ${e.message}`).catch(console.error);
        process.exit(1);
    })
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
        logError(`Error during cleanup: ${error.message}`);
        process.exit(1);
    });
}

//-------------ENTRY POINT----------------
main();
//----------------------------------------