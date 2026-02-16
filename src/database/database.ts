
import mongoose, { CompileModelOptions, Connection, ConnectOptions, Mongoose, Schema } from "mongoose";
import { Globals } from "../globals";
import { logError } from "../log";
import { log } from "console";
import { Models } from "./models/models";
import { exit } from "process";
import { Model } from "mongoose";
import { SimpleShardingStrategy } from "discord.js";
import { ReadConcern } from "mongodb";

export enum DbCollection {
    TOURNAMENT = "tournaments",
    BOT_DEFAULTS = "bot_defaults",
    PLAYERS = "players",
}


export class Database {
    private db: Connection;
    private models: Models | undefined;

    constructor(options?: ConnectOptions) {
        if(!options) {
            options = {
                minPoolSize: 5,
                tls: true,
            };
        }
        
        const uri = Globals.DB_CONNECTION_URI;

        this.db = mongoose.createConnection(uri, options);
        this.db = this.db.useDb(Globals.DATABASE_NAME);
    }

    public dbInner() {
        return this.db.db;
    }

    public getModels(): Models {
        return this.models as Models;
    }
    
    public async init() {
        if(!this.db) {
            logError("Database is not connected");
            exit(1);
        }

        await this.db.getClient().connect();
        log(`Db connection enstablished, using db: ${this.db.name}`);
        this.models = new Models(this.db);
    }

    public async close() {
        await this.db.close();
    }
}