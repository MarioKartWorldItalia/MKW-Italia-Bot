import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, inlineCode, Interaction, Message, MessageFlags, SlashCommandBuilder } from "discord.js";
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
                    roleOption.setName("ruolo_1");
                    roleOption.setDescription("Seleziona il ruolo");
                    roleOption.setRequired(true);
                    return roleOption;
                })
                .addRoleOption(roleOption => {
                    roleOption.setName("ruolo_2");
                    roleOption.setDescription("Ruolo 2");
                    roleOption.setRequired(false);
                    return roleOption;
                })
                .addRoleOption(roleOption => {
                    roleOption.setName("ruolo_3");
                    roleOption.setDescription("Ruolo 3");
                    roleOption.setRequired(false);
                    return roleOption;
                })
                .addRoleOption(roleOption => {
                    roleOption.setName("ruolo_4");
                    roleOption.setDescription("Ruolo 4");
                    roleOption.setRequired(false);
                    return roleOption;
                })
                .addRoleOption(roleOption => {
                    roleOption.setName("ruolo_5");
                    roleOption.setDescription("Ruolo 5");
                    roleOption.setRequired(false);
                    return roleOption;
                })
                .addRoleOption(roleOption => {
                    roleOption.setName("ruolo_6");
                    roleOption.setDescription("Ruolo 6");
                    roleOption.setRequired(false);
                    return roleOption;
                }
        )
        .toJSON()
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

    let roles = [];
    for(let i = 0; i < 6; i++) {
        const role = interaction.options.getRole(`ruolo_${i + 1}`);
        if (role) roles.push(role);
    }

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
            content: `Conferma reset dei ruoli: ${roles.map(r => inlineCode(r.name)).join(", ")}?`,
            components: [new ActionRowBuilder().addComponents(confirmBtn, abortBtn).toJSON()],
            flags: MessageFlags.Ephemeral
        }
    );

    const response = await reply.awaitMessageComponent();
    if (response.customId == "confirm") {
        await response.deferReply({flags: MessageFlags.Ephemeral});
        for(const role of roles) {
            await resetRole(role.id);
        }
        await response.editReply({
            content: "Ruoli resettati: " + roles.map(r => r.name).join(", "),
        })
    }

    await reply.delete()
}