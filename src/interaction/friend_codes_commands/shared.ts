import { ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, inlineCode } from "discord.js";
import { dbGetAllFriendCodes, FriendCode } from "../../frend_codes";
import { BotDefaults, Globals } from "../../globals";
import { Application } from "../../application";

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
        const sentMsg = await channel.send({
            embeds: [await createFriendCodesMessageEmbed(allFCs)],
            components: [createFriendCodesButtons()]
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
            components: [createFriendCodesButtons()]
        })
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

export function createFriendCodesButtons() {
    const addFCButton = new ButtonBuilder()
        .setCustomId("setfc")
        .setLabel("Aggiungi")
        .setStyle(ButtonStyle.Success);

    const removeFCButton = new ButtonBuilder()
        .setCustomId("delfc")
        .setLabel("Rimuovi")
        .setStyle(ButtonStyle.Danger);

    const searchFCButton = new ButtonBuilder()
        .setCustomId("searchfc")
        .setLabel("Cerca Utente")
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(addFCButton, removeFCButton, searchFCButton).toJSON();
}
