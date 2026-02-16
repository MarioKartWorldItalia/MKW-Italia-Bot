import { ChatInputCommandInteraction, MessageFlags, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "./common";
import { Application } from "../../application";

const TOURNAMENT_ID_OPTION = "tournament_id";
const NOME_OPTION = "nome";

export class AggiornaNomeTorneo extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("aggiorna_nome_torneo")
            .setDescription("Aggiorna il nome di un torneo")
            .addStringOption(option =>
                option.setName(TOURNAMENT_ID_OPTION)
                    .setDescription("ID del torneo da aggiornare")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption(option =>
                option.setName(NOME_OPTION)
                    .setDescription("Nuovo nome del torneo")
                    .setRequired(true)
            ).toJSON();
    }

    override async exec(interaction: InteractionOptions): Promise<void> {    
        let _interaction = interaction.interaction
        
        if (await checkAndPopulateAutocomplete(_interaction)) {
            return;
        }

        if(!_interaction.isChatInputCommand()) {
            throw new TypeError();
        }

        _interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const id = _interaction.options.getString(TOURNAMENT_ID_OPTION, true);
        const newName = _interaction.options.getString(NOME_OPTION, true);
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        //controlla che non ci siano tornei identici
        const otherTournaments = await Application.getInstance().getTournamentManager().getTournaments();
        if (otherTournaments.find(
            (t) => { t.getName().toLowerCase() === newName.toLowerCase(); }
        )) {
            _interaction.reply("Non puoi utilizzare lo stesso nome di un altro torneo");
            return;
        }
        
        tournament?.setName(newName);
        if (tournament) {
            await Application.getInstance().getTournamentManager().updateTournament(tournament);
        }

        _interaction.editReply({
            content: `Il nome del torneo **${id}** è stato aggiornato a **${newName}**`,
        });
    }
}