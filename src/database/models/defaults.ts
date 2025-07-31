import { prop } from "@typegoose/typegoose";

export class BotDefaultsSchema {
    @prop({type: String})
    public defaultTournamentRoleAdd!: string;

    //server in cui verranno mandati i messaggi con le informazioni 
    //inserite nel form quando una persona si iscrive ad un torneo
    @prop({type: String})
    public tournamentFormCompiledChannel!: string;
}