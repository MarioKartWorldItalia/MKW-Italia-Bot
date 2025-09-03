import { ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonStyle, ChannelType, Client, codeBlock, EmbedBuilder, inlineCode, Interaction, ModalBuilder, ModalSubmitInteraction, Options, SlashCommandBuilder, SlashCommandStringOption, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { dBAddFriendCode, dbGetAllFriendCodes, dBGetFriendCode, dBRemoveFriendCode, FriendCode, FriendCodeResult, InvalidFriendCode } from "../frend_codes";
import { replyEphemeral } from "../utils";
import { log, logError } from "../logging/log";
import { BotDefaults, Globals } from "../globals";
import { Application } from "../application";
import { randomUUID } from "crypto";

export async function bindFCCommands(client: Client): Promise<Map<String, (i: Interaction) => Promise<void>>> {
    let commands = [];
    let applicationCommands = client.application?.commands;

    commands.push(
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("setfc")
                .setDescription("Aggiungi un codice amico")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("codice")
                        .setDescription("Inserisci il codice amico come mostrato sulla console")
                        .setRequired(true)
                )
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("delfc")
                .setDescription("Rimuove il tuo codice amico dalla lista")
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("getfc")
                .setDescription("Ottieni il codice amico di un utente")
                .addUserOption(option => {
                    return option.setName("user_id")
                        .setDescription("ID della persona di cui ottenere il codice amico")
                        .setRequired(true);
                })
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("mansetfc")
                .setDescription("Aggiunge il codice amico di una persona")
                .addUserOption(option => {
                    return option.setName("user_id")
                        .setDescription("ID della persona a cui aggiungere il codice amico")
                        .setRequired(true);
                })
                .addStringOption(option => {
                    return option.setName("codice")
                        .setDescription("Codice amico da aggiungere")
                        .setRequired(true);
                })
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("mandelfc")
                .setDescription("Rimuove il codice amico di una persona")
                .addUserOption(option => {
                    return option.setName("user_id")
                        .setDescription("ID Discord della persona di cui rimuovere il codice amico")
                        .setRequired(true);
                })
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("listafc")
                .setDescription("Ottiene la lista di tutti i codici amico registrati")
        )
    );

    Promise.all(commands).then(() => { log("Comandi codici amico aggiornati") });

    let ret = new Map<String, (i: Interaction) => Promise<void>>;
    ret.set("setfc", onAddFc);
    ret.set("delfc", onRemoveFc);
    ret.set("mansetfc", onAdminAddFc);
    ret.set("mandelfc", onAdminRemoveFc);
    ret.set("listafc", onAdminGetAllFc);
    ret.set("getfc", onGetFc);
    ret.set("searchfc", onSearchFc);
    return ret;
}

async function onAddFc(interaction: Interaction) {
    let replyInteraction: Interaction = interaction;
    let code;
    if (interaction.isChatInputCommand()) {
        code = interaction.options.getString("codice", true);
    }
    else if (interaction.isButton()) {
        const modal = new ModalBuilder()
            .setCustomId("setfc_modal" + " " + randomUUID())
            .setTitle("Aggiungi Codice Amico")
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId("codice")
                        .setLabel("Codice amico")
                        .setPlaceholder("Inserisci il codice amico come mostrato sulla console")
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph)
                )
            )
        await interaction.showModal(modal);
        replyInteraction = await interaction.awaitModalSubmit({ time: 1000 * 60 * 5 });
        code = replyInteraction.fields.getTextInputValue("codice");
    }
    else {
        throw new Error();
    }

    try {
        const fc = new FriendCode(code);
        await dBAddFriendCode(interaction.user, fc);
        await replyEphemeral(replyInteraction, `Codice amico ${fc.toString()} aggiunto correttamente. Se era già presente un codice amico, questo verrà sovrascritto`);
    }
    catch (e) {
        if (e instanceof InvalidFriendCode) {
            await replyEphemeral(replyInteraction, "Il codice amico inserito non è valido. Assicurati di averlo scritto correttamente come mostrato sulla console (es. SW-1234-5678-9012)");
            return;
        }
        throw e;
    }
    await refreshFriendCodesMessage();
}

async function onRemoveFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) {
        throw new Error();
    }

    let rm = await dBRemoveFriendCode(interaction.user);
    if (rm == FriendCodeResult.NOT_PRESENT) {
        await replyEphemeral(interaction, "Non hai un codice amico registrato");
        return;
    }
    else if (rm == FriendCodeResult.OK) {
        await replyEphemeral(interaction, "Il tuo codice amico è stato rimosso correttamente");
    }
    await refreshFriendCodesMessage();
}

async function onGetFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    const user = interaction.options.getUser("user_id", true);
    const fc = await dBGetFriendCode(user);
    if (!fc) {
        await replyEphemeral(interaction, `<@${user.id}> non ha un codice amico registrato`);
        return;
    }
    await replyEphemeral(interaction, `Il codice amico di <@${user.id}> è: ${inlineCode(fc.toString())}`);
}

async function onAdminAddFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const user = interaction.options.getUser("user_id", true);
    const code = interaction.options.getString("codice", true);

    try {
        const fc = new FriendCode(code);
        await dBAddFriendCode(user, fc);
        await replyEphemeral(interaction, `Codice amico ${fc.toString()} aggiunto correttamente a ${user.tag}`);
    }
    catch (e) {
        if (e instanceof InvalidFriendCode) {
            await replyEphemeral(interaction, "Il codice amico inserito non è valido. Assicurati di averlo scritto correttamente come mostrato sulla console (es. SW-1234-5678-9012)");
            return;
        }
        throw e;
    }
    await refreshFriendCodesMessage();
}

async function onAdminRemoveFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const user = interaction.options.getUser("user_id", true);

    let rm = await dBRemoveFriendCode(user);
    if (rm == FriendCodeResult.NOT_PRESENT) {
        await replyEphemeral(interaction, `${user.tag} non ha un codice amico registrato`);
        return;
    }
    else if (rm == FriendCodeResult.OK) {
        await replyEphemeral(interaction, `Il codice amico di ${user.tag} è stato rimosso correttamente`);
    }
    await refreshFriendCodesMessage();
}

async function onAdminGetAllFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    let friendCodes = await dbGetAllFriendCodes();

    if (friendCodes.size == 0) {
        await replyEphemeral(interaction, "Nessun codice amico registrato");
        return;
    }

    let reply = "Lista codici amico:\n";
    friendCodes.forEach((value, key) => {
        reply = reply.concat(`<@${key}>: ${value.toString()}\n`);
    });
    await replyEphemeral(interaction, reply);
}

async function onSearchFc(interaction: Interaction) {
    if (!interaction.isButton())
        return;
    const modal = new ModalBuilder()
        .setCustomId("searchfc_modal" + " " + randomUUID())
        .setTitle("Cerca Codice Amico Utente")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("user_tag")
                    .setLabel("Username dell'utente")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        )
    await interaction.showModal(modal);
    const replyInteraction = await interaction.awaitModalSubmit({ time: 1000 * 60 * 5 });
    const userTag = replyInteraction.fields.getTextInputValue("user_tag").toLowerCase();

    const guild = await Application.getInstance().getMainGuild();
    await guild.members.fetch();
    let member = guild.members.cache.find(m => m.user.tag.toLowerCase() === userTag);
    if (!member) {
        member = guild.members.cache.find(m => m.user.displayName.toLowerCase() === userTag)
    }
    if (!member) {
        member = guild.members.cache.find(m => m.user.globalName?.toLowerCase() === userTag)
    }
    if (!member) {
        member = guild.members.cache.find(m => m.nickname?.toLowerCase() === userTag)
    }

    if (!member) {
        replyEphemeral(replyInteraction, "Non è stato trovato alcun giocatore con il nome inserito");
    }

    else {
        const fc = await dBGetFriendCode(member.user);
        if (!fc) {
            await replyEphemeral(replyInteraction, `<@${member.id}> non ha un codice amico registrato`);
            return;
        }
        await replyEphemeral(replyInteraction, `Il codice amico di <@${member.id}> è: ${inlineCode(fc.toString())}`);
    }
}

async function refreshFriendCodesMessage() {
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


async function createFriendCodesMessageEmbed(friendCodes: Map<string, FriendCode>): Promise<APIEmbed> {

    const guild = await Application.getInstance().getMainGuild();
    await guild.members.fetch();

    async function joinFriendCodes(fcs: Map<string, FriendCode>): Promise<string> {
        let ret = "";
        let append = "";

        fcs.forEach((value, key) => {
            const member = guild.members.cache.get(key);
            if (!member) {
                throw new Error("Member not found");
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

function createFriendCodesButtons() {
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