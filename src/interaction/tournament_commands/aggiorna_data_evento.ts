import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { Application } from "../../application";

const TOURNAMENT_ID_OPTION = "evento";
const DATA_ORA_OPTION = "data_ora_primo_girone";

export class AggiornaDataEvento extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("aggiorna_data_evento")
            .setDescription("Aggiorna la data e ora di un evento")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(TOURNAMENT_ID_OPTION)
                    .setDescription("Seleziona un evento")
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DATA_ORA_OPTION)
                    .setDescription("Nuova data e ora (YYYY-MM-DD HH:mm)")
                    .setRequired(true)
            )
            .toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (options.interaction.isAutocomplete()) {
            await checkAndPopulateAutocomplete(options.interaction);
            return;
        }

        if (!(options.interaction instanceof ChatInputCommandInteraction)) {
            throw new Error();
        }

        options.interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const id = options.getRequiredStringOption(TOURNAMENT_ID_OPTION);
        const newDateTime = options.getRequiredStringOption(DATA_ORA_OPTION);
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        let date = new Date(newDateTime);
        if (isNaN(date.getTime())) {
            options.interaction.editReply({
                content: `La data e ora fornita non sono valide. Usa il formato YYYY-MM-DD HH:mm.`,
            });
            return;
        }

        tournament?.setDateTime(date);
        if (tournament) {
            await Application.getInstance().getTournamentManager().updateTournament(tournament);
        }

        options.interaction.editReply({
            content: `La data e ora del torneo **${id}** sono state aggiornate a **${date.toISOString()}**`,
        });
    }
}
