import { ButtonInteraction, ChatInputCommandInteraction, Interaction, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { log, logError } from "./logging/log";

export async function replyEphemeral(interaction: Interaction, msg: string) {
    if (interaction.isRepliable()) {
        await interaction.reply({
            content: msg,
            flags: MessageFlags.Ephemeral
        })
        return;
    }

    else {
        let interactionName = "";
        if (interaction.isChatInputCommand()) {
            const cmd = interaction as ChatInputCommandInteraction;
            interactionName = cmd.commandName;
        } else if (interaction.isButton()) {
            const btn = interaction as ButtonInteraction;
            interactionName = btn.customId;
        } else if (interaction.isModalSubmit()) {
            const modal = interaction as ModalSubmitInteraction;
            interactionName = modal.customId;
        }
        else return;

        logError(`Error: ${interactionName} (id: ${(interaction as Interaction).id}) is not repliable, or already replied`)
        log(`Further details, printing stack...\n ${new Error().stack || "No data available"}`);
    }
}

export function standardDiscordTimeFormat(ts: Date): string {
    return `<t:${Math.floor(ts.getTime() / 1000)}:f>`;
}