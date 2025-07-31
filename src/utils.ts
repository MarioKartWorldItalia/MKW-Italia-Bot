import { ButtonInteraction, ChatInputCommandInteraction, GuildMember, Interaction, MessageFlags, ModalSubmitInteraction, Role } from "discord.js";
import { log, logError } from "./logging/log";
import { Application } from "./application";

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
export async function resetRole(roleId: string) {
    const guild = await Application.getInstance().getMainGuild();
    await guild.members.fetch();
    const role = await guild.roles.fetch(roleId);

    if (!role) {
        throw new Error("Role not found");
    }
    
    let members = role.members;

    for (const member of members.values()) {
        await member.roles.remove(role);
    }
}