import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CommandBase, InteractionOptions } from "../interaction_base_classes";


const DISPLAY_NAME_OPTION = "display_name";
const TOURNAMENT_ID_OPTION = "tournament_id";

export class ConfermaIscrizione extends CommandBase {

    override get commandName(): string {
        return "conferma_iscrizione_modal_submit";
    }

    override async exec(interaction: InteractionOptions): Promise<void> {
        //todo
        return;
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

        return new ModalBuilder()
            .setCustomId(this.createCustomId(options))
            .setTitle("Iscriviti al torneo")
            .addComponents(actionRow1, actionRow2, actionRow3, actionRow4);
    }

}