import { Application } from "./application"

export enum BotEmojis {
    BANDIERINA = "bandierina",
    FRECCIA_MINORE = "arrowleft",
    SPUNTA = "check",
    IRON = "iron",
    BRONZE = "bronze",
    SILVER = "silver",
    GOLD = "gold",
    PLATINUM = "platinum",
    SAPPHIRE = "sapphire",
    RUBY = "ruby",
    DIAMOND = "diamond",
    MASTER = "master",
    GRANDMASTER = "grandmaster",
    MKADD = "mkadd",
    MKDEL = "mkdel",
    MKFIND = "mkfind",
}

export class EmojisManager {
    public static async getEmoji(emojiName: BotEmojis): Promise<string> {
        const client = Application.getInstance().getClient();
        await client.application?.emojis.fetch();
        const found = client.application?.emojis.cache.find(e=>e.name==emojiName);
        if(!found) {
            throw new Error(`Emoji ${emojiName} not found`);
        }
        return found.toString();
    }
}