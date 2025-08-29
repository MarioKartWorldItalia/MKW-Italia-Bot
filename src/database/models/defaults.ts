import { prop } from "@typegoose/typegoose";
import { Schema } from "mongoose";

export class FriendCodesDbDefaults {
    public channelId!: string;
    public messageId?: string;
}

export class BotDefaultsSchema {
    @prop({type: String})
    public defaultTournamentRoleAdd!: string;

    //server in cui verranno mandati i messaggi con le informazioni 
    //inserite nel form quando una persona si iscrive ad un torneo
    @prop({type: String})
    public tournamentFormCompiledChannel!: string;

    @prop({type: Schema.Types.Mixed, default: {}})
    public friendCodesDbDefaults: FriendCodesDbDefaults = new FriendCodesDbDefaults();
    
}