import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { ButtonOrModalCommandBase, CommandBase, InteractionOptions, SlashCommandBase } from "../commands";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { ConfermaIscrizioneModal } from "./conferma_iscrizione";

export class Iscriviti extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        let _builder = new SlashCommandBuilder()
            .setName("iscriviti")
            .setDescription("Iscriviti ad un evento");

        let options = new SlashCommandStringOption()
            .setName("tournament_id")
            .setDescription("Seleziona un evento")
            .setAutocomplete(true)
            .setRequired(true);


        _builder.addStringOption(options);
        return _builder;
    }

    override async exec(options: InteractionOptions): Promise<void> {
        let interaction = options.interaction;
        if (options.interaction.isAutocomplete()) {
            checkAndPopulateAutocomplete(options.interaction);
            return;
        }

        let id = options.getRequiredStringOption("tournament_id");
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            await replyEphemeral(interaction, "Errore, torneo non trovato");
            return;
        }

        if (tournament?.isPlayerPartecipating(options.getInteractionUser().id) === true) {
            replyEphemeral(
                interaction,
                `Sei già iscritto al torneo **${tournament?.getName()}**`
            )
        }

        if (interaction.isChatInputCommand() || interaction.isButton()) {
            interaction.showModal(
                new ConfermaIscrizioneModal(tournament._id!.toString()).getModal()
            );
        }
    }
}

export class IscrivitiBtn extends Iscriviti {
    private tournamentId: string;
    public constructor(tournament: string) {
        super()
        this.tournamentId = tournament;
    }

    public createButton(): ButtonBuilder {
        let options = new Map();
        options.set("tournamet_id", this.tournamentId);

        return new ButtonBuilder()
            .setCustomId(this.createCustomId(options))
            .setLabel("Iscriviti")
            .setStyle(ButtonStyle.Primary);
    }

}
