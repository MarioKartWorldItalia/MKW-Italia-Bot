import { Date, model, Model, omitUndefined, Schema, SchemaType } from "mongoose";
import { ObjectId } from "mongodb";
import { Tournament, TournamentManager } from "../../tournament_manager/tournaments";
import { prop } from "@typegoose/typegoose";


export class TournamentSchema {
    @prop({ required: true, type: String })
    public tournamentName!: String;
}
