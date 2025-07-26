
import mongoose, { CompileModelOptions, Connection, ConnectOptions, Mongoose, Schema } from "mongoose";
import { Globals } from "../globals";
import { logError } from "../logging/log";
import { log } from "console";
import { Models } from "./models/models";
import tournamentSchema from "./models/tournament_model";
import { exit } from "process";
import { Model } from "mongoose";
import { SimpleShardingStrategy } from "discord.js";

export enum DbCollection {
    TOURNAMENT = "Tournament",
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
        log(`Db connection enstablished, using db: ${this.db.name}`);
    }

    public createModel<T>(name: DbCollection, schema?: Schema, options?: CompileModelOptions): Model<T> {
        if(!options) {
            options = {
                overwriteModels: false,
            }
        }
        
        return this.db.model<T>(name, schema, undefined, options);
    }

    public getModels(): Models {
        return this.models as Models;
    }
    
    public init() {
        if(!this.db) {
            logError("Database is not connected");
            exit(1);
        }
        this.models = new Models();
    }

    public async close() {
        await this.db.close();
    }
}