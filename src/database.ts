import mongoDb, { MongoClient, MongoOptions, Document, MongoDBNamespace } from "mongodb";
import { Globals } from "./globals";
import { StringMappedInteractionTypes } from "discord.js";
import { log, logError } from "./logging/log";
class CustomDoc implements Document {
    _id?: mongoDb.ObjectId;
    test: String;

    public constructor(test: String) {
        this.test = test;
    }
    
    
}
export enum DbCollection {
    TOURNAMENTS = "tournaments",
}

const collectionDocTypes: Record<DbCollection, new (...args: any[]) => Document> = {
    [DbCollection.TOURNAMENTS]: CustomDoc
};



export class Database {
    private client;
    private db;

    public constructor(options: MongoOptions | undefined) {
        if(!options) {
            options = {
                minPoolSize: 5,
            } as MongoOptions;
        }

        this.client = new MongoClient(Globals.DB_CONNECTION_URI, options);
        this.db = this.client.db(Globals.DATABASE_NAME);
        this.db.command({ ping: 1}).then(() => {
            log("Database connection established successfully.");
        })
        .catch((error) => {
            logError("Error connecting to the database:", error);
            throw new Error("Database connection failed");
        });
    }

    public async dispose() {
        await this.client.close();
    } 

}