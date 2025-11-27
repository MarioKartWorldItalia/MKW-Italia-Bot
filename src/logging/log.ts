import { Colors, EmbedBuilder } from "discord.js";
import { Application } from "../application";
import { Globals } from "../globals";
import { tz } from "moment-timezone";

class Logger {
    static log(...args: any[]) {
        console.log(...args);
    }

    static async logError(...args: any[]) {
        console.error(...args);

        if (Application.getInstance()) {
            await Logger.printErrToServer(args);
        }
    }

    static async printErrToServer(args: any[]) {
        let server = await Application.getInstance().getMainGuild();
        let channel = await server.channels.fetch(Globals.ERR_REPORT_CHANNEL_ID!);
        let user = "";
        if (Globals.ERR_REPORT_USER_ID) {
            user = `<@${Globals.ERR_REPORT_USER_ID}>`;
        }

        if (channel && channel.isTextBased()) {
            let embed = new EmbedBuilder()
                .setTitle("Error Report")
                .setColor(Colors.Red)
                .setDescription("Error content:\n" + args)
                .setTimestamp(new Date());
            await channel.send({ content: user, embeds: [embed] });
        }
    }
}

export function log(...args: any[]) {
    Logger.log(...args);
}

export async function logError(...args: any[]) {
    try { await Logger.logError(...args); }
    catch (e) { console.error("Failed to log error:", e); }
}