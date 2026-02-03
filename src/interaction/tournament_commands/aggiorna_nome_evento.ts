import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { Application } from "../../application";
import { log } from "../../log";

const TOURNAMENT_ID_OPTION = "evento";
const NOME_OPTION = "nome";

export class AggiornaNomeEvento extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("aggiorna_nome_evento")
            .setDescription("Aggiorna il nome di un evento")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(TOURNAMENT_ID_OPTION)
                    .setDescription("Seleziona un evento")
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(NOME_OPTION)
                    .setDescription("Nuovo nome dell'evento")
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
        const newName = options.getRequiredStringOption(NOME_OPTION);
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        //controlla che non ci siano tonrei identici
        const otherTournaments = await Application.getInstance().getTournamentManager().getTournaments();
        if (otherTournaments.find(
            (t) => { t.getName().toLowerCase() === newName.toLowerCase(); log(`tournament name check: ${t.getName().toLowerCase()} vs ${newName.toLowerCase()}`); return t.getName().toLowerCase() === newName.toLowerCase() }
        )) {
            options.interaction.reply("Non puoi utilizzare lo stesso nome di un altro torneo");
            return;
        }

        tournament?.setName(newName);
        if (tournament) {
            await Application.getInstance().getTournamentManager().updateTournament(tournament);
        }

        options.interaction.editReply({
            content: `Il nome del torneo **${id}** è stato aggiornato a **${newName}**`,
        });
    }
}
