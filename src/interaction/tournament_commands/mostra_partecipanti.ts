import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, SlashCommandBooleanOption, ChatInputCommandInteraction } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { Application } from "../../application";
import { ObjectId } from "mongodb";

const TOURNAMENT_ID_OPTION = "evento";
const EPHEMERAL_OPTION = "ephemeral";

export class MostraPartecipanti extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("mostra_partecipanti")
            .setDescription("Mostra la lista dei partecipanti ad un evento")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(TOURNAMENT_ID_OPTION)
                    .setDescription("Seleziona un evento")
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                    .setName(EPHEMERAL_OPTION)
                    .setDescription("Mostra il messaggio solo a te (default: true)")
                    .setRequired(false)
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

        const id = options.getRequiredStringOption(TOURNAMENT_ID_OPTION);
        let ephemeralOption = options.interaction.options.getBoolean(EPHEMERAL_OPTION);
        if (ephemeralOption == null) {
            ephemeralOption = true;
        }

        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(new ObjectId(id || ""));

        const players = tournament?.getPlayers() ?? [];
        const response = players.length > 0
            ? players
                .sort((a, b) => a.joinDateTime.getTime() - b.joinDateTime.getTime())
                .map((player) => `<@${player.playerId}> - ${player.displayName}`).join('\n')
            : "Nessun partecipante al torneo.";

        options.interaction.reply({
            content: `Partecipanti al torneo **${tournament?.getName()}**:\n${response}`,
            ephemeral: ephemeralOption
        });
    }
}
