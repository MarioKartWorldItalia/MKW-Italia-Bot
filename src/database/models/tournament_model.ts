import { model, Model, omitUndefined, Schema, SchemaType, SchemaTypes, Types } from "mongoose";
import { ObjectId } from "mongodb";
import { Tournament, TournamentManager, TournamentPlayerEntry } from "../../tournament_manager/tournaments";
import { mongoose, prop } from "@typegoose/typegoose";
import { log } from "../../log";

export class TournamentSchema {
    public constructor() { }

    public setValues(t: Tournament) {
        if (t.getId()) {
            this._id = t.getId() as ObjectId;
        }

        this.tournamentName = t.getName();
        this.description = t.getDescription();
        this.startDateTime = t.getDateTime();
        this.serverMessageChannelId = t.getServerMessage()?.channelId;
        this.serverMessageId = t.getServerMessage()?.id;
        this.parteciparingPlayers = t.getPlayers();
        this.isTournament = t.isTournament;
            this.mode = t.getMode();
            this.nRaces = t.getNumberOfRaces();
            this.minPlayers = t.getMinPlayers();
            this.maxPlayers = t.getMaxPlayers();
            this.bracket2Date = t.getSecondBracketDate();
    
            this.eventPlanners = new mongoose.Types.Map<String>();

        for(const [key, value] of t.getEventPlanners()) {
            this.eventPlanners.set(key, value);
        }

    }

    public _id!: ObjectId;

    @prop({ required: true, type: String })
    public tournamentName!: String;

    @prop({ required: true, type: Date })
    public startDateTime!: Date;

    @prop({ type: String })
    public description?: String;

    @prop({ type: Array<TournamentPlayerEntry> })
    public parteciparingPlayers!: Array<TournamentPlayerEntry>;

    @prop({ type: String })
    public serverMessageId?: String;

    @prop({ type: String })
    public serverMessageChannelId?: String;

    @prop({ type: Boolean, default: true, required: true })
    public isTournament: Boolean = true;

    @prop({ type: SchemaTypes.Map, default: () => new Types.Map() })
    public eventPlanners: mongoose.Types.Map<String> = new mongoose.Types.Map();

    @prop({ type: Date })
    public bracket2Date?: Date;

    @prop({ type: String })
    public mode?: String;

    @prop({ type: Number })
    public nRaces?: Number;

    @prop({ type: Number })
    public minPlayers?: Number;
    
    @prop({ type: Number })
    public maxPlayers?: Number;
}
