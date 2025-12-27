import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, ChatInputCommandInteraction, ButtonInteraction } from "discord.js";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class Unsubscribe extends SlashCommandBase {
    override get commandName(): string {
        return "disiscriviti";
    }

    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()

    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (await checkAndPopulateAutocomplete(options.interaction)) {
            return;
        }
        const id = options.getRequiredStringOption("tournament_id");

        if (!(options.interaction instanceof ChatInputCommandInteraction)
            && !(options.interaction instanceof ButtonInteraction)) {
            throw new TypeError();
        }
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            replyEphemeral(options.interaction, "Torneo non trovato");
            return;
        }

        if (tournament?.isPlayerPartecipating(options.getInteractionUser().id) === false) {
            options.interaction.reply({
                content: `Non sei iscritto al torneo **${tournament?.getName()}**`,
                ephemeral: true
            });
            return;
        }
    }
}