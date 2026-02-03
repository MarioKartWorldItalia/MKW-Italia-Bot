import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, MessageFlags, GuildMember, Role, EmbedBuilder } from "discord.js";
import { CommandBase, InteractionOptions } from "../interaction_base_classes";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { BotDefaults, Globals } from "../../globals";
import { assertCond } from "../../assert";
import { log } from "../../log";
import { updateTournamentTable } from "../tournament_commands";

const DISPLAY_NAME_OPTION = "display_name";
const TOURNAMENT_ID_OPTION = "tournament_id";
const REGOLE_LETTE_OPTION = "regole_lette";
const ESPERIENZA_COMPETITIVA_OPTION = "esperienza_competitiva";
const TEAM_OPTION = "team";

export class ConfermaIscrizione extends CommandBase {

    override get commandName(): string {
        return "conferma_iscrizione_modal_submit";
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (!(options.interaction instanceof ModalSubmitInteraction)) {
            throw new Error();
        }

        const castInteraction = options.interaction as ModalSubmitInteraction;
        const id = options.getOption<string>(TOURNAMENT_ID_OPTION);
        if (!id) {
            await replyEphemeral(options.interaction, "Torneo non trovato");
            return;
        }
        
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            await replyEphemeral(options.interaction, "Torneo non trovato");
            return;
        }

        const displayName = castInteraction.fields.getTextInputValue(DISPLAY_NAME_OPTION);
        tournament.addPlayer(options.interaction.user.id, displayName);
        await Application.getInstance().getTournamentManager().updateTournament(tournament);

        const roleAdd = (await BotDefaults.getDefaults()).defaultTournamentRoleAdd;
        if (roleAdd != "") {
            const role = await options.interaction.guild?.roles.fetch(roleAdd);
            if (options.interaction.member instanceof GuildMember
                && role instanceof Role
            ) {
                await options.interaction.member.roles.add(role);
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

        if (channel) {
            const sendTo = await Application.getInstance().getClient().channels.fetch(channel);
            if (sendTo && sendTo.isSendable()) {
                let embed = new EmbedBuilder()
                    .setTitle("Nuova iscrizione")
                    .setDescription(`<@${options.interaction.user.id}> si è iscritto al torneo **${tournament.getName()}**`)
                    .setColor(Globals.STANDARD_HEX_COLOR)
                    .setAuthor({ iconURL: options.interaction.user.displayAvatarURL(), name: options.interaction.user.username })
                    .setTimestamp(new Date());

                embed.addFields([
                    { name: "Nome in game", value: displayName, inline: true },
                    { name: "Regole lette", value: castInteraction.fields.getTextInputValue(REGOLE_LETTE_OPTION), inline: true },
                    { name: "Esperienza competitiva", value: castInteraction.fields.getTextInputValue(ESPERIENZA_COMPETITIVA_OPTION) || "N/A", inline: false },
                    { name: "Squadra", value: castInteraction.fields.getTextInputValue(TEAM_OPTION) || "N/A", inline: true },
                ])
                sendTo.send({ embeds: [embed] });
            }
        }

        log(`Giocatore ${options.interaction.user.id} iscritto al torneo ${tournament?.getName()}(${id})`)
        await updateTournamentTable(tournament);
    }
}

export class ConfermaIscrizioneModal extends ConfermaIscrizione {
    tournamentId: string;
    public constructor(tournament: string) {
        super();
        this.tournamentId = tournament;
    }
    
    public getModal() {
        const row1 =
            new TextInputBuilder()
                .setCustomId(REGOLE_LETTE_OPTION)
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
            .setCustomId(ESPERIENZA_COMPETITIVA_OPTION)
            .setLabel("Esperienza competitiva")
            .setPlaceholder("Inserisci la tua esperienza competitiva")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const row4 = new TextInputBuilder()
            .setCustomId(TEAM_OPTION)
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

        return new ModalBuilder()
            .setCustomId(this.createCustomId(options))
            .setTitle("Iscriviti al torneo")
            .addComponents(actionRow1, actionRow2, actionRow3, actionRow4);
    }

}