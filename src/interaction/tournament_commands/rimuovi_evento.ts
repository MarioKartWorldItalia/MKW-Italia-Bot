import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, ChatInputCommandInteraction, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { InteractionOptions, SlashCommandBase, ButtonOrModalCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { Application } from "../../application";

const TOURNAMENT_ID_OPTION = "evento";
const CONFERMA_CANCELLAZIONE_NAME = "confirm_delete";

export class RimuoviEvento extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("rimuovi_evento")
            .setDescription("Rimuovi un evento")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(TOURNAMENT_ID_OPTION)
                    .setDescription("Seleziona un evento")
                    .setAutocomplete(true)
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

        const id = options.getRequiredStringOption(TOURNAMENT_ID_OPTION);
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            options.interaction.reply({
                content: `Torneo con ID **${id}** non trovato.`,
                ephemeral: true
            });
            return;
        }

        const confirm = new ButtonBuilder()
            .setCustomId(`${CONFERMA_CANCELLAZIONE_NAME} true ${tournament.getId()?.toString()}`)
            .setLabel("Conferma cancellazione")
            .setStyle(ButtonStyle.Danger);

        const cancel = new ButtonBuilder()
            .setCustomId(`${CONFERMA_CANCELLAZIONE_NAME} false`)
            .setLabel("Annulla")
            .setStyle(ButtonStyle.Primary);

        const buttons = [
            new ActionRowBuilder().addComponents(cancel).toJSON(),
            new ActionRowBuilder().addComponents(confirm).toJSON()
        ];

        options.interaction.reply(
            {
                content: `Sei sicuro di voler eliminare il torneo "${tournament.getName()}"? (id: ${tournament.getId()})`,
                components: buttons,
            }
        )
    }
}

export class ConfermaRimozioneEvento extends ButtonOrModalCommandBase {
    get commandName(): string {
        return CONFERMA_CANCELLAZIONE_NAME;
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (!(options.interaction instanceof ButtonInteraction)) {
            throw new Error();
        }

        await options.interaction.deferReply();
        await options.interaction.message.removeAttachments();

        const choiceBool = options.interaction.customId.split(" ")[1].toLowerCase() == "true";

        if (choiceBool) {
            const tournamentId = options.interaction.customId.split(" ")[2];
            const tManager = Application.getInstance().getTournamentManager();
            const tournament = await tManager.getTournamentById(tournamentId);

            const msg = options.interaction.message;
            if (msg && msg.deletable) {
                msg.delete();
            }

            if (!tournament) {
                options.interaction.editReply(`Il torneo con id **${tournamentId}** non è stato trovato`);
                return;
            }

            await tManager.removeTournament(tournament);
            if (tournament.tournamentChannelId) {
                const guild = Application.getInstance().getMainGuild();
                const channel = await (await guild).channels.fetch(tournament.tournamentChannelId);
                if (channel) {
                    channel.delete();
                }
            }
            await options.interaction.editReply(`Il torneo "**${tournament.getName()}"** con id: **${tournament.getId()}** è stato eliminato`);
            return;
        }

        else {
            let msg = options.interaction.message;
            if (msg && msg.deletable) {
                msg.delete();
            }
            options.interaction.deleteReply();
        }
    }
}
