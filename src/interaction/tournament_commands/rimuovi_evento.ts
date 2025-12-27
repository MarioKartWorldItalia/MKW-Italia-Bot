import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { Application } from "../../application";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "./common";
import { ButtonStyle } from "discord.js";
import { ConfermaRimozioneTorneo } from "./conferma_rimozione";

const TOURNAMENT_ID_OPTION = "evento";

export class RimuoviEvento extends SlashCommandBase {
    override get builder() {
        return new SlashCommandBuilder()
            .setName("rimuovi_evento")
            .setDescription("Rimuovi un evento")
            .addStringOption(option =>
                option.setName(TOURNAMENT_ID_OPTION)
                    .setDescription("ID del torneo da rimuovere")
                    .setRequired(true)
                    .setAutocomplete(true)
            ).toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        let interaction = options.interaction;
        if (await checkAndPopulateAutocomplete(interaction)) {
            return;
        }

        if (!interaction.isChatInputCommand()) {
            throw new TypeError();
        }

        const id = options.getRequiredStringOption(TOURNAMENT_ID_OPTION);
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            interaction.reply({
                content: `Torneo con ID **${id}** non trovato.`,
                ephemeral: true
            });
            return;
        }
        interaction.reply(new ConfermaRimozioneTorneo().getDefaultMessage(tournament));
    }
}