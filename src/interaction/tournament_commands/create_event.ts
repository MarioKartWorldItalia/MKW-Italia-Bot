import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, SlashCommandIntegerOption, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ChatInputCommandInteraction, ChannelType, CategoryChannel } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import moment from "moment-timezone";
import { BotDefaults, Globals } from "../../globals";
import { replyEphemeral } from "../../utils";
import { Tournament } from "../../tournament_manager/tournaments";
import { Application } from "../../application";
import { randomUUID } from "crypto";
import { assertCond } from "../../assert";
import { updateTournamentTable } from "../tournament_commands";
import { log } from "../../log";

const NOME_OPTION = "nome";
const DATA_ORA_OPTION = "data_ora_primo_girone";
const DATA_ORA_2_BRACKET_OPTION = "data_ora_secondo_girone";
const MODE_OPTION = "modalità";
const NUMERO_CORSE_OPTION = "numero_corse";
const MIN_MAX_PLAYERS_OPTION = "min_max_players";

export class CreateEvent extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription("Aggiungi un evento")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(NOME_OPTION)
                    .setDescription("Nome dell'evento")
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DATA_ORA_OPTION)
                    .setDescription("Data e ora dell'evento (YYYY-MM-DD HH:mm)")
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DATA_ORA_2_BRACKET_OPTION)
                    .setDescription("Data e ora del secondo girone (YYYY-MM-DD HH:mm)")
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(MODE_OPTION)
                    .setDescription("Modalità dell'evento (FFA/Squad etc.)")
                    .setChoices(
                        { name: "Knockout 150cc", value: "Knockout 150cc" },
                        { name: "Corsa, 150 cc, FFA, no cpu", value: "Corsa, 150 cc, FFA, no cpu" },
                        { name: "Corsa, 150 cc, FFA, cpu difficili", value: "Corsa, 150 cc, FFA, cpu difficili" },
                        { name: "Corsa, 150 cc, A squadre, no cpu", value: "Corsa, 150 cc, A squadre, no cpu" },
                        { name: "Corsa, 150 cc, A squadre, cpu difficili", value: "Corsa, 150 cc, A squadre, cpu difficili" },
                    )
                    .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                    .setName(NUMERO_CORSE_OPTION)
                    .setDescription("Numero di corse del torneo")
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(MIN_MAX_PLAYERS_OPTION)
                    .setDescription("Minimo e massimo giocatori (es. 8-16), 0 per nessun limite")
                    .setRequired(true)
            )
            .toJSON();
    }

    get commandName(): string {
        return "aggiungi_evento";
    }

    public async exec(options: InteractionOptions): Promise<void> {
        if(!(options.interaction instanceof ChatInputCommandInteraction)) {
            throw new TypeError("Interaction is not a ChatInputCommandInteraction");
        }
        
        const name = options.getRequiredStringOption(NOME_OPTION);
        const dateTimeUnaparsed = options.getRequiredStringOption(DATA_ORA_OPTION);
        const dateTime = moment.tz(dateTimeUnaparsed, Globals.STANDARD_TIMEZONE).toDate();

        //2 bracket
        const dateTime2BracketUnaparsed = options.getRequiredStringOption(DATA_ORA_2_BRACKET_OPTION);
        const dateTime2Bracket = moment.tz(dateTime2BracketUnaparsed, Globals.STANDARD_TIMEZONE).toDate();

        const mode = options.getRequiredStringOption(MODE_OPTION);
        const nRaces = options.getRequiredIntOption(NUMERO_CORSE_OPTION);
        const minMaxPlayers = options.getRequiredStringOption(MIN_MAX_PLAYERS_OPTION);

        if (isNaN(dateTime.valueOf())) {
            await replyEphemeral(options.interaction, `La data e ora fornita non sono valide. Usa il formato DD-MM-YYYY HH:mm.`);
            return;
        }

        if (isNaN(dateTime2Bracket.valueOf())) {
            await replyEphemeral(options.interaction, `La data e ora del secondo girone fornita non sono valide. Usa il formato DD-MM-YYYY HH:mm.`);
            return;
        }

        let tournament = new Tournament(dateTime, name, mode);
        tournament.setSecondBracketDate(dateTime2Bracket);

        if (nRaces) {
            if (nRaces <= 0) {
                await replyEphemeral(options.interaction, `Il numero di corse deve essere maggiore di 0.`);
                return;
            }
            tournament.setNumberOfRaces(nRaces);
        }

        if (minMaxPlayers) {
            const split = minMaxPlayers.split("-");
            if (split.length != 2) {
                replyEphemeral(options.interaction, "Minimo e massimo giocatori non valido");
                return;
            }
            const min = parseInt(split[0]);
            const max = parseInt(split[1]);
            if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || (max != 0 && min > max)) {
                replyEphemeral(options.interaction, "Minimo e massimo giocatori non valido");
                return;
            }
            if (min != 0) {
                tournament.setMinPlayers(min);
            }
            if (max != 0) {
                tournament.setMaxPlayers(max);
            }
        }


        const otherTournaments = await Application.getInstance().getTournamentManager().getTournaments();

        if (otherTournaments.find(
            (v) => v.getName().toLowerCase() === tournament.getName().toLowerCase())) {
            await replyEphemeral(options.interaction, `Esiste già un evento con il nome **${tournament.getName()}**.`);
            return;
        }

        const descriptionModalUUID = randomUUID();
        const descriptionModal = new ModalBuilder()
            .setCustomId(descriptionModalUUID)
            .setTitle("Aggiungi una descrizione (facoltativo)")
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("description")
                            .setLabel("Descrizione")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                            .setPlaceholder("Aggiungi una descrizione al torneo")
                    )
            );
        
        await options.interaction.showModal(descriptionModal);
        const response = await options.interaction.awaitModalSubmit({ time: 1000 * 60 * 5 });
        if (response.customId === descriptionModalUUID) {
            const description = response.fields.getTextInputValue("description");
            if (description && description != "") {
                tournament.setDescription(description);
            }
        }

        await Application.getInstance().getTournamentManager().addTournament(tournament);
        
        const newChannel = await createChannelForTournament(tournament);
        tournament.tournamentChannelId = newChannel.id;
        await updateTournamentTable(tournament);
        await response.reply(`Evento **${tournament.getName()}** aggiunto con successo!`);
    }
}

async function createChannelForTournament(tournament: Tournament) {
        let defaultCategory = (await BotDefaults.getDefaults()).tournamentDefaults.categoryId;
        let guild = Application.getInstance().getMainGuild();
        let categoryChannel = await (await guild).channels.fetch(defaultCategory) as CategoryChannel;
        let formatDate = moment(tournament.getDateTime()).format('DD-MM-YYYY');
        let newChannel = await categoryChannel.children.create(
            {
                name: `${tournament.getName()}  ${formatDate}`,
                type: ChannelType.GuildText,
            }
        );
        assertCond(newChannel != null, "Could not create tournament channel");
        return newChannel;
}