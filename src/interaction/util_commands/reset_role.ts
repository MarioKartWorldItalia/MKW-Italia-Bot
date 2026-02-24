import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, ButtonStyle, ButtonBuilder, ActionRowBuilder, MessageFlags, inlineCode } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { logError } from "../../log";
import { resetRole } from "../../utils";

export class ResetRole extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
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
            .toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        let interaction = options.interaction;

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
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, abortBtn).toJSON()],
            flags: MessageFlags.Ephemeral
        }
    );

    const response = await reply.awaitMessageComponent();
    if (response.customId === "confirm") {
        await response.deferReply({flags: MessageFlags.Ephemeral});
        for(const role of roles) {
            await resetRole(role.id);
        }
        await response.editReply({
            content: "Ruoli resettati: " + roles.map(r => r.name).join(", "),
        });
    }

    await reply.delete();
    }
}