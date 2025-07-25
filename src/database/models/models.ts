import { getModelForClass } from "@typegoose/typegoose";
import { Application } from "../../application";
import { DbCollection } from "../database";
import tournamentSchema, { TournamentSchema } from "./tournament_model";
import { model, Model } from "mongoose";
import { getCachedSchema } from "@typegoose/typegoose/lib/internal/utils";

export class Models {
    public readonly tournamentModel;

    public constructor() {
    let db = Application.getInstance().getDb();

    const schema = getCachedSchema(TournamentSchema);
    this.tournamentModel = getModelForClass(TournamentSchema);
    this.tournamentModel.insertOne({})
    }
}