import { IntentsBitField } from "discord.js";
import { env } from "process";

export class Globals {
    static readonly DEFAULT_INTENTS = [
            IntentsBitField.Flags.Guilds,
    ]

    static readonly MAX_SERVERS = 1;
    static readonly BOT_TOKEN = env.DISCORD_BOT_TOKEN;
    static readonly VERSION = "0.1";
    static readonly MAIN_GUILD = env.APPROVED_GUILD || (() => { throw new Error("APPROVED_GUILD environment variable is not set") })();
    
    static readonly DEBUG_TOURNAMENT_ROLE_ADD = env.DEBUG_TOURNAMENT_ROLE_ADD || "";
}