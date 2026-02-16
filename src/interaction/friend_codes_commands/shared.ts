import { ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, inlineCode } from "discord.js";
import { dbGetAllFriendCodes, FriendCode } from "../../frend_codes";
import { BotDefaults, Globals } from "../../globals";
import { Application } from "../../application";
import { BotEmojis, EmojisManager } from "../../emoijs_manager";

export async function refreshFriendCodesMessage() {
    const allFCs = await dbGetAllFriendCodes();
    const defaults = await BotDefaults.getDefaults();

    let msgId = defaults.friendCodesDbDefaults.messageId;
    const channelId = defaults.friendCodesDbDefaults.channelId;
    const channel = await (await Application.getInstance().getMainGuild()).channels.fetch(channelId);
    if (!channel) {
        throw new Error("Channel for friend codes not found");
    }

    if (!(channel.type === ChannelType.GuildText)) {
        throw new Error("Channel for friend codes is not a text channel");
    }

    if (!msgId) {
        const firstMsg = "https://cdn.discordapp.com/attachments/1376213461251526797/1473061687866167316/Lc4MvTM.png?ex=69957fda&is=69942e5a&hm=fdeb5511f47914e2a17450a4a1cf5e29e1cb9ff45bf26f9297a25ed8967daf59&";
        await channel.send(firstMsg);
        const sentMsg = await channel.send({
            embeds: [await createFriendCodesMessageEmbed(allFCs)],
            components: [await createFriendCodesButtons()]
        });
        defaults.friendCodesDbDefaults.messageId = sentMsg.id;
        await BotDefaults.setDefaults(defaults);
    }
    else {
        const msg = await channel.messages.fetch(msgId);
        if (!msg) {
            throw new Error("Message for friend codes not found");
        }

        await msg.edit({
            embeds: [await createFriendCodesMessageEmbed(allFCs)],
            components: [await createFriendCodesButtons()]
        });
    }
}


export async function createFriendCodesMessageEmbed(friendCodes: Map<string, FriendCode>): Promise<APIEmbed> {

    const guild = await Application.getInstance().getMainGuild();

    async function joinFriendCodes(fcs: Map<string, FriendCode>): Promise<string> {
        let ret = "";
        let append = "";

        fcs.forEach((value, key) => {
            const member = guild.members.cache.get(key);
            if (!member) {
                return;
            }

            ret = ret.concat(`${append}${inlineCode("-")} <@${key}> (${member.nickname || member.displayName}) — ${inlineCode(value.toString())}`);
            append = "\n";
        });
        return ret;
    }

    let description = `
### Lista Codici Amico
Usa i pulsanti in basso per aggiungere (o rimuovere) il tuo codice amico alla lista. Con il pulsante **\"Cerca Utente\"** puoi digitare l'username di un utente e ottenere il suo codice amico (se presente in lista).

**Codici amico presenti:**
${await joinFriendCodes(friendCodes)}
    `;

    let embed = new EmbedBuilder()
        .setColor(Globals.STANDARD_HEX_COLOR)
        .setThumbnail("https://cdn.discordapp.com/attachments/911287953228185610/1411006185779237048/MKT_Icon_Friends.png?ex=68b31569&is=68b1c3e9&hm=0535da90eb7ccee662639248384f2cc8a0433664de3f9a0056f36aca792ec384&")
        .setDescription(description);
    return embed.toJSON();
}

export async function createFriendCodesButtons() {
    const addFCButton = new ButtonBuilder()
        .setCustomId("setfc")
        .setLabel("Aggiungi")
        .setEmoji(await EmojisManager.getEmoji(BotEmojis.MKADD))
        .setStyle(ButtonStyle.Success);

    const removeFCButton = new ButtonBuilder()
        .setCustomId("delfc")
        .setLabel("Rimuovi")
        .setEmoji(await EmojisManager.getEmoji(BotEmojis.MKDEL))
        .setStyle(ButtonStyle.Danger);

    const searchFCButton = new ButtonBuilder()
        .setCustomId("searchfc")
        .setLabel("Cerca Utente")
        .setEmoji(await EmojisManager.getEmoji(BotEmojis.MKFIND))
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(addFCButton, removeFCButton, searchFCButton).toJSON();
}