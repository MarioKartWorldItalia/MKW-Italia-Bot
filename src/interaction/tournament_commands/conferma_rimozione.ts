import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionReplyOptions } from "discord.js";
import { Tournament } from "../../tournament_manager/tournaments";
import { CommandBase, InteractionOptions } from "../interaction_base_classes";
import { Application } from "../../application";
import { log } from "../../log";

export class ConfermaRimozioneTorneo extends CommandBase {
    override get commandName(): string {
        return "conferma_cancellazione_evento";
    }

    public getDefaultMessage(tournament: Tournament): InteractionReplyOptions {

        let confirmOptions = new Map();
        confirmOptions.set("tournament_id", tournament.getId()!.toString());
        confirmOptions.set("confirm_delete", "true");

        const confirm = new ButtonBuilder()
            .setCustomId(super.createCustomId(confirmOptions))
            .setLabel("Conferma cancellazione")
            .setStyle(ButtonStyle.Danger);

        const cancelOptions = new Map();
        cancelOptions.set("tournament_id", tournament.getId()!.toString());
        cancelOptions.set("confirm_delete", "false");

        const cancel = new ButtonBuilder()
            .setCustomId(super.createCustomId(cancelOptions))
            .setLabel("Annulla")
            .setStyle(ButtonStyle.Primary);

        const buttons = [
            new ActionRowBuilder().addComponents(cancel).toJSON(),
            new ActionRowBuilder().addComponents(confirm).toJSON()
        ];
        return {
            content: `Sei sicuro di voler eliminare il torneo "${tournament.getName()}"? (id: ${tournament.getId()})`,
            components: buttons,
        }
    }

    override async exec(options: InteractionOptions): Promise<void> {
        let interaction = options.interaction;
        if (!interaction.isButton()) {
            throw new TypeError();
        }

        await interaction.deferReply();
        await interaction.message.removeAttachments();


        const choiceBool = options.getRequiredStringOption("confirm_delete") === "true";

        if (choiceBool) {
            const tournamentId = options.getRequiredStringOption("tournament_id");
            const tManager = Application.getInstance().getTournamentManager();
            const tournament = await tManager.getTournamentById(tournamentId);


            if (!tournament) {
                interaction.editReply(`Il torneo con id **${tournamentId}** non è stato trovato`);
                return;
            }

            await tManager.removeTournament(tournament);
            await interaction.editReply(`Il torneo "**${tournament.getName()}"** con id: **${tournament.getId()}** è stato eliminato`);
        }

        let msg = interaction.message;
        if (msg && msg.deletable) {
            msg.delete();
        }
        interaction.deleteReply();
    }
}