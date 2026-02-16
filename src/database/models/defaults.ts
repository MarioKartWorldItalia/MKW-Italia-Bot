import { prop } from "@typegoose/typegoose";
import { Schema } from "mongoose";

export class TournamentDefaults {
    @prop({type: String, required: true, default: ""})
    public categoryId!: string;
}

export class FriendCodesDbDefaults {
    public channelId!: string;
    public messageId?: string;
}

export class BotDefaultsSchema {
    @prop({type: String})
    public defaultTournamentRoleAdd!: string;

    @prop({type: Number})
    public mkCentralSeason!: number;

    @prop({type: String})
    public MMRTableChannelId?: string;

    @prop({type: String})
    public MMRTableMessageId?: string;

    @prop({type: String})
    public staffMMRAddChannelId!: string;

    @prop({type: String})
    public publicRankChangeChannelId!: string;

    @prop()
    public rankRoles: string[] = [];

    //server in cui verranno mandati i messaggi con le informazioni 
    //inserite nel form quando una persona si iscrive ad un torneo
    @prop({type: String})
    public tournamentFormCompiledChannel!: string;

    @prop({type: Schema.Types.Mixed, default: {}})
    public friendCodesDbDefaults: FriendCodesDbDefaults = new FriendCodesDbDefaults();
 
    @prop({ type: () => TournamentDefaults })
    public tournamentDefaults: TournamentDefaults = new TournamentDefaults();
}