import { IntentsBitField } from "discord.js";
import { env } from "process";
import { logError } from "./logging/log";

export class Globals {
    static readonly DEFAULT_INTENTS = [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMembers,
    ]

    static readonly MAX_SERVERS = 1;
    static readonly BOT_TOKEN = env.DISCORD_BOT_TOKEN;
    static readonly VERSION = "0.1";
    static readonly MAIN_GUILD = env.APPROVED_GUILD || (() => { throw new Error("APPROVED_GUILD environment variable is not set") })();
    
    //DB
    static readonly DB_CONNECTION_URI = env.DB_CONNECTION_URI || (() => { throw new Error("DB_CONNECTION_URI environment variable is not set") })();
    static readonly DATABASE_NAME = getDbNameFromEnv();

    static readonly STANDARD_HEX_COLOR = "#ffc809";
    static readonly STANDARD_TIMEZONE = "Europe/Rome";

    static readonly DEBUG_TOURNAMENT_ROLE_ADD = env.DEBUG_TOURNAMENT_ROLE_ADD || "";
}

function getDbNameFromEnv(): string {
    const dbName = env.DATABASE_NAME;
    if (!dbName) {
        logError("DATABASE_NAME environment variable is not set. Using default 'unknown'.");
        return "unknown";
    }
    return dbName;
}