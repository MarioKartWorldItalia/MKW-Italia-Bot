import { getModelForClass, getModelWithString } from "@typegoose/typegoose";
import { Application } from "../../application";
import { DbCollection } from "../database";
import { Connection, model, Model, Mongoose } from "mongoose";
import { Tournament } from "../../tournament_manager/tournaments";
import { BotDefaultsSchema } from "./defaults";
import { Others } from "./others";

export class Models {
    public readonly tournamentModel;
    public readonly botDefaultsModel;
    public readonly othersModel;
    
    public constructor(connection: Connection) {
        this.tournamentModel = getModelForClass(Tournament, {
            existingConnection: connection,
            schemaOptions: {
                collection: DbCollection.TOURNAMENT.toString(),
                strict: true,
            }
        })

        this.botDefaultsModel = getModelForClass(BotDefaultsSchema, {
            existingConnection: connection,
            schemaOptions: {
                collection: DbCollection.BOT_DEFAULTS.toString(),
                capped: {
                    max: 1
                },
                strict: true,
            }
        })

        this.othersModel = getModelForClass(Others, {
            existingConnection: connection,
            schemaOptions: {
                collection: DbCollection.OTHERS.toString(),
                strict: true,
                capped: {
                    max: 1
                }
            }
            
        })
    }
}