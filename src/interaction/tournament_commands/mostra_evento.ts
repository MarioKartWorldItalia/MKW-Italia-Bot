import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, ChatInputCommandInteraction } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete, createTournamentMessage } from "../tournament_commands";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";

const TOURNAMENT_ID_OPTION = "evento";

export class MostraEvento extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("mostra_evento")
            .setDescription("Mostra le informazioni di un evento")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(TOURNAMENT_ID_OPTION)
                    .setDescription("Seleziona un evento")
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (options.interaction.isAutocomplete()) {
            await checkAndPopulateAutocomplete(options.interaction);
            return;
        }

        if (!options.interaction.isChatInputCommand()) {
            throw new Error();
        }

        const channel = options.interaction.channel;
        const id = options.getRequiredStringOption(TOURNAMENT_ID_OPTION);
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);
        if (!tournament) {
            replyEphemeral(options.interaction, "Il torneo non esiste");
        }

        if (channel?.isSendable()) {
            await channel.send(await createTournamentMessage(tournament!));
        }
    }
}
