import { IntentsBitField, GatewayIntentBits } from "discord.js";
import { env } from "process";
import { logError } from "./logging/log";
import { BotDefaultsSchema as BotDefaultsSchema } from "./database/models/defaults";
import { Application } from "./application";
import { ReturnModelType } from "@typegoose/typegoose";
import { BeAnObject } from "@typegoose/typegoose/lib/types";
import { log } from "console";

export class Globals {
    static readonly DEFAULT_INTENTS = [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMembers,
            GatewayIntentBits.GuildMembers,
    ]

    static readonly MAX_SERVERS = 1;
    static readonly BOT_TOKEN = env.DISCORD_BOT_TOKEN;
    static readonly VERSION = "0.6";
    static readonly MAIN_GUILD = env.APPROVED_GUILD || (() => { throw new Error("APPROVED_GUILD environment variable is not set") })();
    
    //DB
    static readonly DB_CONNECTION_URI = env.DB_CONNECTION_URI?.replace(new RegExp("\"","g"),"") || (() => { throw new Error("DB_CONNECTION_URI environment variable is not set") })();
    static readonly DATABASE_NAME = getDbNameFromEnv();

    //ERR_REPORTING
    static readonly ERR_REPORT_CHANNEL_ID = env.ERROR_LOGS_CHANNEL;
    static readonly ERR_REPORT_USER_ID = env.ERROR_REPORTS_USER

    static readonly STANDARD_HEX_COLOR = "#ffc809";
    static readonly STANDARD_TIMEZONE = "Europe/Rome";
}

function getDbNameFromEnv(): string {
    const dbName = env.DATABASE_NAME;
    if (!dbName) {
        logError("DATABASE_NAME environment variable is not set. Using default 'unknown'.");
        return "unknown";
    }
    return dbName;
}

export class BotDefaults {
    private static model: ReturnModelType<typeof BotDefaultsSchema, BeAnObject> | undefined = undefined;

    private static populateSchema() {
        BotDefaults.model = Application.getInstance().getDb().getModels().botDefaultsModel;
    }

    public static async clearDefaults() {
        BotDefaults.populateSchema();
        const res = await BotDefaults.model?.deleteOne({});
        log("Bot defaults cleared:");
        log(res);
    }

    public static async setDefaults(defaults: BotDefaultsSchema) {
        BotDefaults.populateSchema();

        const found = await BotDefaults.model?.findOne({}).exec();
        if(!found) {
            const res = await BotDefaults.model?.insertOne(defaults);
            log("Default bot settings changed:");
            log(res);
        }
        else {
            const res = await found.updateOne(defaults).exec();
            log("Default bot settings changed:");
            log(res);
        }
    }

    public static async getDefaults(): Promise<BotDefaultsSchema> {
        BotDefaults.populateSchema();

        const query = await BotDefaults.model?.find({});

        if(!query || query.length != 1) {
            throw new Error("Defaults not valid");
        }
        return query[0] as BotDefaultsSchema;
    }
}