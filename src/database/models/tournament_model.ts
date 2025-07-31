import { model, Model, omitUndefined, Schema, SchemaType } from "mongoose";
import { ObjectId } from "mongodb";
import { Tournament, TournamentManager } from "../../tournament_manager/tournaments";
import { prop } from "@typegoose/typegoose";
import { log } from "../../logging/log";


export class TournamentSchema  {
    public constructor(t: Tournament) {      
        if(t.getId()) {
            this._id = t.getId() as ObjectId;
        }
        this.tournamentName = t.getName();
        this.description = t.getDescription();
        this.startDateTime = t.getDateTime();
        this.serverMessageChannelId = t.getServerMessage()?.channelId;
        this.serverMessageId = t.getServerMessage()?.id;
        this.parteciparingPlayers = t.getPlayers();
    }
    
    public _id!: ObjectId;

    @prop({ required: true, type: String })
    public tournamentName!: String;

    @prop({ required: true, type: Date })
    public startDateTime!: Date;

    @prop({ type: String })
    public description?: String;

    @prop({type: Array<String>})
    public parteciparingPlayers!: Array<String>;

    @prop({ type: String })
    public serverMessageId?: String;

    @prop({type: String})
    public serverMessageChannelId?: String;
}
