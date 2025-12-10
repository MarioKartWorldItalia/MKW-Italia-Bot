import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, Interaction, Message, MessageFlags, SlashCommandBuilder } from "discord.js";
import { log, logError } from "../log";
import { Application } from "../application";
import { resetRole } from "../utils";

export async function bindGeneralCommands(client: Client): Promise<Map<string, (interaction: Interaction) => Promise<void>>> {
    let commandsPromises = [];
    commandsPromises.push(
        client.application?.commands.create(
            new SlashCommandBuilder()
                .setName("resetta_ruolo")
                .setDescription("Rimuove il ruolo da tutti gli utenti")
                .addRoleOption(roleOption => {
                    roleOption.setName("ruolo");
                    roleOption.setDescription("Seleziona il ruolo");
                    roleOption.setRequired(true);
                    return roleOption;
                })
        )
    );
    Promise.all(commandsPromises).then(() => log("Comandi di util aggiornati")).catch(logError);
    let ret = new Map();
    ret.set("resetta_ruolo", onRoleReset);
    return ret;
}

async function onRoleReset(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        logError("Not a chat input command");
        return;
    }

    const role = interaction.options.getRole("ruolo", true);
    const confirmBtn = new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("Conferma")
        .setStyle(ButtonStyle.Danger);

    const abortBtn = new ButtonBuilder()
        .setCustomId("abort")
        .setLabel("Annulla")
        .setStyle(ButtonStyle.Primary);

    const reply = await interaction.reply(
        {
            content: `Conferma reset del ruolo ${role.name}, con id ${role.id}`,
            components: [new ActionRowBuilder().addComponents(confirmBtn, abortBtn).toJSON()],
            flags: MessageFlags.Ephemeral
        }
    );

    const response = await reply.awaitMessageComponent();
    if (response.customId == "confirm") {
        await response.deferReply({flags: MessageFlags.Ephemeral});
        await resetRole(role.id);
        await response.editReply({
            content: "Ruolo resettato: " + role.name,
        })
    }

    await reply.delete()
}