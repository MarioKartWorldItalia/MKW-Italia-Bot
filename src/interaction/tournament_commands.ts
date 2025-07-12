import { Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption, TextInputBuilder, TextInputStyle, ModalBuilder, RestOrArray, ActionRowBuilder, ModalSubmitInteraction, Interaction, MessageFlags } from "discord.js";
import { Tournament } from "../tournaments.js";
import { Application } from "../application.js";
import { get } from "http";
import { log } from "console";

const ISCRIVITI_NAME = "iscriviti";
const DISISCRIVITI_NAME = "disiscriviti";
const RIMUOVI_TORNEO_NAME = "rimuovi_torneo";

const MOSTRA_GIOCATORI = "mostra_giocatori"
const AGGIUNGI_TORNEO_NAME = "aggiungi_torneo";
const AGGIOGRNA_DATA_NAME = "aggiorna_data_torneo";
const AGGIORNA_NOME_TORNEO_NAME = "aggiorna_nome_torneo";
const NOME_OPTION = "nome";
const DATA_ORA_OPTION = "data_ora";

const ISCRIZIONE_TORNEO_MODAL_NAME = "modal_tournament_add_player"
const REGOLE_LETTE_OPTION = "rules"
const ESPERIENZA_COMPETITIVA_OPTION = "competitive_experience"

const TURNAMENT_ID_OPTION = "torneo";


export function bindTournamentCommands(client: Client) : Map<string, (interaction: Interaction) => void> {
    client.application?.commands.create(
        new SlashCommandBuilder()
            .setName(AGGIUNGI_TORNEO_NAME)
            .setDescription("Aggiungi un torneo")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(NOME_OPTION)
                    .setDescription("Nome del torneo")
                    .setRequired(true),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DATA_ORA_OPTION)
                    .setDescription("Data e ora del torneo (YYYY-MM-DD HH:mm)")
                    .setRequired(true),
            )
            .toJSON(),
    );

    refreshTournaments(Application.getInstance().getTournamentManager().tournaments);
    return getTournamentCommandHandlers();
}

export function refreshTournaments(tournaments: Tournament[]) {
    let commands = Application.getInstance().client.application?.commands;
    commands?.create(createTournamentsCommand(tournaments, ISCRIVITI_NAME, "Iscriviti ad un torneo").toJSON());
    commands?.create(createTournamentsCommand(tournaments, DISISCRIVITI_NAME, "Disiscriviti da un torneo").toJSON());
    commands?.create(createTournamentsCommand(tournaments, RIMUOVI_TORNEO_NAME, "Rimuovi un torneo").toJSON());
    commands?.create(createTournamentsCommand(tournaments, MOSTRA_GIOCATORI, "Mostra i giocatori partecipanti").toJSON())
    commands?.create(
        createTournamentsCommand(tournaments, AGGIORNA_NOME_TORNEO_NAME, "Aggiorna il nome di un torneo")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(NOME_OPTION)
                    .setDescription("Nuovo nome del torneo")
                    .setRequired(true)
            )
            .toJSON()
    );
    commands?.create(
        createTournamentsCommand(tournaments, AGGIOGRNA_DATA_NAME, "Aggiorna la data e l'ora di un torneo")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DATA_ORA_OPTION)
                    .setDescription("Nuova data e ora del torneo (YYYY-MM-DD HH:mm)")
                    .setRequired(true)
            )
            .toJSON()
    );
}

function createTournamentsCommand(tournaments: Tournament[], name: string, description: string): SlashCommandBuilder {
    let builder = new SlashCommandBuilder()
        .setName(name)
        .setDescription(description);

    let options = new SlashCommandStringOption()
        .setName(TURNAMENT_ID_OPTION)
        .setDescription("Seleziona un torneo")
        .setRequired(true);

    for (const tournament of tournaments) {
        options.addChoices({
            name: tournament.getName(),
            value: tournament.getUuid()
        });
    }

    builder.addStringOption(options);
    return builder;
}


// ------------- FUNZIONI HANDLER -----------------

export function getTournamentCommandHandlers() : Map<string, (interaction: Interaction) => void> {
    const handlers = new Map();

    handlers.set(ISCRIVITI_NAME, onIscriviti);
    handlers.set(DISISCRIVITI_NAME, onDisiscriviti);
    handlers.set(AGGIUNGI_TORNEO_NAME, onAggiungiTorneo);
    handlers.set(RIMUOVI_TORNEO_NAME, onRimuoviTorneo);
    handlers.set(AGGIORNA_NOME_TORNEO_NAME, onAggiornaNomeTorneo);
    handlers.set(AGGIOGRNA_DATA_NAME, onAggiornaDataOra);
    handlers.set(MOSTRA_GIOCATORI, onMostraPartecipanti);
    handlers.set(ISCRIZIONE_TORNEO_MODAL_NAME, onModalIscriviti)

    return handlers;
}

function onIscriviti(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION, true);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);
    
    if (tournament?.isPlayerPartecipating(interaction.user.id) === true) {
        interaction.reply({
            content: `Sei già iscritto al torneo **${tournament?.getName()}**`,
            ephemeral: true
        });
        return;
    }

    const row1 =
        new TextInputBuilder()
        .setCustomId(REGOLE_LETTE_OPTION)
        .setStyle(TextInputStyle.Short)
        .setLabel("Hai letto le regole?")
        .setPlaceholder("Se non l'hai fatto, assicurati di leggerle prima di iscriverti al torneo!")
        .setRequired(true);

    const row2 =  new TextInputBuilder()
        .setCustomId(ESPERIENZA_COMPETITIVA_OPTION)
        .setLabel("Esperienza competitiva")
        .setPlaceholder("Inserisci la tua esperienza competitiva")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);


    const actionRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(row1);
    const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(row2);

    const tournamentId = interaction?.options.get(TURNAMENT_ID_OPTION)?.value;
    const modal = new ModalBuilder()
        .setCustomId(`${ISCRIZIONE_TORNEO_MODAL_NAME} ${tournamentId}`)
        .setTitle("Iscriviti al torneo")
        .addComponents(actionRow1, actionRow2);

    interaction.showModal(modal);
}

function onMostraPartecipanti(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id || "");

    const players = tournament?.getPlayers() ?? [];
    const response = players.length > 0
        ? players.map((playerId: string) => `<@${playerId}>`).join('\n')
        : "Nessun partecipante al torneo.";

    interaction.reply({
        content: `Partecipanti al torneo **${tournament?.getName()}**:\n${response}`,
        ephemeral: true
    });
}

function onDisiscriviti(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION, true);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);

    if (tournament?.isPlayerPartecipating(interaction.user.id) === false) {
        interaction.reply({
            content: `Non sei iscritto al torneo **${tournament?.getName()}**`,
            ephemeral: true
        });
        return;
    }

    tournament?.removePlayer(interaction.user.id);

    interaction.reply({
        content: `Ti sei disiscritto dal torneo **${tournament?.getName()}**`,
        ephemeral: true
    });
}

function onModalIscriviti(interaction: Interaction) {
    const castInteraction = interaction as ModalSubmitInteraction;
    const id = castInteraction.customId.split(" ")[1];
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);
    tournament?.addPlayer(interaction.user.id);

    castInteraction.reply(
        {
            content: "Iscrizione completata con successo",
            flags: MessageFlags.Ephemeral
        }
    );

    log(`Giocatore ${interaction.user.id} iscritto al torneo ${tournament?.getName()}(${id})`)
}

function onAggiungiTorneo(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString(NOME_OPTION, true);
    const dateTimeUnaparsed = interaction.options.getString(DATA_ORA_OPTION, true);
    const dateTime = new Date(dateTimeUnaparsed);
    if (isNaN(dateTime.valueOf())) {
        interaction.reply({
            content: `La data e ora fornita non sono valide. Usa il formato YYYY-MM-DD HH:mm.`,
            ephemeral: true
        });
        return;
    }

    const tournament = new Tournament(dateTime, name);
    Application.getInstance().getTournamentManager().addTournament(tournament);

    interaction.reply({
        content: `Torneo **${tournament.getName()}** aggiunto con successo!`,
        ephemeral: true
    });

    refreshTournaments(Application.getInstance().getTournamentManager().tournaments);
}

function onRimuoviTorneo(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION, true);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);

    if (!tournament) {
        interaction.reply({
            content: `Torneo con ID **${id}** non trovato.`,
            ephemeral: true
        });
        return;
    }

    Application.getInstance().getTournamentManager().removeTournament(tournament);

    interaction.reply({
        content: `Torneo **${tournament.getName()}** rimosso con successo!`,
        ephemeral: true
    });

    refreshTournaments(Application.getInstance().getTournamentManager().getTournaments());
}

function onAggiornaNomeTorneo(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION, true);
    const newName = interaction.options.getString(NOME_OPTION, true);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);

    tournament?.setName(newName);
    interaction.reply({
        content: `Il nome del torneo **${id}** è stato aggiornato a **${newName}**`,
        ephemeral: true
    });
    refreshTournaments(Application.getInstance().getTournamentManager().getTournaments());
}

function onAggiornaDataOra(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION, true);
    const newDateTime = interaction.options.getString(DATA_ORA_OPTION, true);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);

    let date = new Date(newDateTime);
    if (isNaN(date.getTime())) {
        interaction.reply({
            content: `La data e ora fornita non sono valide. Usa il formato YYYY-MM-DD HH:mm.`,
            ephemeral: true
        });
        return;
    }

    tournament?.setDateTime(date);
    interaction.reply({
        content: `La data e ora del torneo **${id}** sono state aggiornate a **${date.toISOString()}**`,
        ephemeral: true
    });
    refreshTournaments(Application.getInstance().getTournamentManager().getTournaments());  
}
