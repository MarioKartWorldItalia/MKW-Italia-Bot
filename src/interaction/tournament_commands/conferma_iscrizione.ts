import { ActionRowBuilder, GuildMember, MessageFlags, ModalBuilder, ModalSubmitInteraction, Role, TextInputBuilder, TextInputStyle, User } from "discord.js";
import { CommandBase, InteractionOptions } from "../interaction_base_classes";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { BotDefaults } from "../../globals";
import { assertCond } from "../../assert";
import { log } from "../../log";


const DISPLAY_NAME_OPTION = "display_name";
const TOURNAMENT_ID_OPTION = "tournament_id";

export class ConfermaIscrizione extends CommandBase {

    override get commandName(): string {
        return "conferma_iscrizione_modal_submit";
    }

    override async exec(options: InteractionOptions): Promise<void> {
        const castInteraction = options.interaction as ModalSubmitInteraction;
        const id = options.getRequiredStringOption(TOURNAMENT_ID_OPTION);
        const playerId = options.getRequiredStringOption("user_id");
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            await replyEphemeral(options.interaction, "Torneo non trovato");
            return;
        }

        const displayName = castInteraction.fields.getTextInputValue("display_name");
        tournament.addPlayer(playerId, displayName);
        await Application.getInstance().getTournamentManager().updateTournament(tournament);

        const roleAdd = (await BotDefaults.getDefaults()).defaultTournamentRoleAdd;
        if (roleAdd != "") {
            const role = await options.interaction.guild?.roles.fetch(roleAdd);
            const user = options.interaction.guild?.members.cache.get(playerId);
            if (user instanceof GuildMember && role instanceof Role
            ) {
                await user.roles.add(role);
            }
        }

        await castInteraction.reply(
            {
                content: "Iscrizione completata con successo",
                flags: MessageFlags.Ephemeral
            }
        );

        const channel = (await BotDefaults.getDefaults()).tournamentFormCompiledChannel;
        assertCond(channel !== undefined);
    }
}

export class ConfermaIscrizioneModal extends ConfermaIscrizione {
    tournamentId: string;
    user: User;
    public constructor(tournament: string, user: User) {
        super();
        this.tournamentId = tournament;
        this.user = user;
    }

    public getModal() {
        const row1 =
            new TextInputBuilder()
                .setCustomId("regole_lette")
                .setStyle(TextInputStyle.Paragraph)
                .setLabel("Hai letto le regole?")
                .setPlaceholder("Se non l'hai fatto, assicurati di leggerle prima di iscriverti al torneo!")
                .setRequired(true);

        const row2 = new TextInputBuilder()
            .setCustomId(DISPLAY_NAME_OPTION)
            .setLabel("Nome in game")
            .setPlaceholder("Inserisci il tuo nome in game (lo stesso della console)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const row3 = new TextInputBuilder()
            .setCustomId("esperienza_competitiva")
            .setLabel("Esperienza competitiva")
            .setPlaceholder("Inserisci la tua esperienza competitiva")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const row4 = new TextInputBuilder()
            .setCustomId("team")
            .setLabel("Squadra")
            .setPlaceholder("Squadra con cui partecipi. Compila solo se il torneo è a squadre")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const actionRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(row1);
        const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(row2);
        const actionRow3 = new ActionRowBuilder<TextInputBuilder>().addComponents(row3);
        const actionRow4 = new ActionRowBuilder<TextInputBuilder>().addComponents(row4);
        let options = new Map();
        options.set(TOURNAMENT_ID_OPTION, this.tournamentId);
        options.set("user_id", this.user.id);

        return new ModalBuilder()
            .setCustomId(this.createCustomId(options))
            .setTitle("Iscriviti al torneo")
            .addComponents(actionRow1, actionRow2, actionRow3, actionRow4)
            .toJSON();
        }

}