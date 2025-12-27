import { ButtonBuilder, ButtonInteraction, ButtonStyle, MessageFlags } from "discord.js";
import { Tournament } from "../../tournament_manager/tournaments";
import { Application } from "../../application";
import { assertCond } from "../../assert";
import { updateTournamentTable } from "../tournament_commands";
import { ButtonOrModalCommandBase, InteractionOptions } from "../interaction_base_classes";

export class CheckInButton extends ButtonOrModalCommandBase {
    override get commandName(): string {
        return "checkin"
    }

    public getButton(tournamentId: string): ButtonBuilder {
        let options = new Map<string, string>();
        options.set("tournament_id", tournamentId);

        return new ButtonBuilder()
            .setCustomId(this.createCustomId(options))
            .setLabel("Fai il check-in")
            .setStyle(ButtonStyle.Primary);
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if(!(options.interaction instanceof ButtonInteraction)) {
            throw new TypeError();
        }
        
        const id = options.getRequiredStringOption("tournament_id");
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);
        assertCond(tournament !== null);

        if (tournament!.isPlayerPartecipating(options.getInteractionUser().id) === false) {
            await options.interaction.reply({
                content: "Non sei iscritto a questo torneo",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const player = tournament!.getPlayers().find((p) => p.playerId === options.getInteractionUser().id);
        if (player?.checkedIn) {
            await options.interaction.reply({
                content: "Hai già effettuato il check-in",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        player!.checkedIn = true;
        await Application.getInstance().getTournamentManager().updateTournament(tournament!);

        await options.interaction.reply({
            content: "Check-in effettuato con successo",
            flags: MessageFlags.Ephemeral
        });
        updateTournamentTable(tournament!);
    }
}