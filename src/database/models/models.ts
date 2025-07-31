import { getModelForClass, getModelWithString } from "@typegoose/typegoose";
import { Application } from "../../application";
import { DbCollection } from "../database";
import { TournamentSchema } from "./tournament_model";
import { Connection, model, Model, Mongoose } from "mongoose";
import { Tournament } from "../../tournament_manager/tournaments";
import { BotDefaultsSchema } from "./defaults";

export class Models {
    public readonly tournamentModel;
    public readonly botDefaultsModel;

    public constructor(connection: Connection) {
        this.tournamentModel = getModelForClass(TournamentSchema, {
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
    }
}