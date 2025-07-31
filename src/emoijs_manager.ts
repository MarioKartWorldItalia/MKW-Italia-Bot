import { Application } from "./application"
import { ApplicationEmoji } from "discord.js"

export enum BotEmojis {
    BANDIERINA = "bandierina",
    FRECCIA_MINORE = "arrowleft",
}

export class EmojisManager {
    public static async getEmoji(emojiName: BotEmojis): Promise<ApplicationEmoji> {
        const client = Application.getInstance().getClient();
        await client.application?.emojis.fetch();
        const found = client.application?.emojis.cache.find(e=>e.name==emojiName);
        if(!found) {
            throw new Error(`Emoji ${emojiName} not found`);
        }
        return found;
    }
}