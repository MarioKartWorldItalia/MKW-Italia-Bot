import { Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption, TextInputBuilder, TextInputStyle, ModalBuilder, RestOrArray, ActionRowBuilder, ModalSubmitInteraction } from "discord.js";
import { Tournament } from "../tournaments.js";
import { Application } from "../application.js";
import { get } from "http";

const ISCRIVITI_NAME = "iscriviti";
const DISISCRIVITI_NAME = "disiscriviti";
const RIMUOVI_TORNEO_NAME = "rimuovi_torneo";

const MOSTRA_GIOCATORI = "mostra_giocatori"
const AGGIUNGI_TORNEO_NAME = "aggiungi_torneo";
const AGGIOGRNA_DATA_NAME = "aggiorna_data_torneo";
const AGGIORNA_NOME_TORNEO_NAME = "aggiorna_nome_torneo";
const NOME_OPTION = "nome";
const DATA_ORA_OPTION = "data_ora";

const TURNAMENT_ID_OPTION_NAME = "torneo";


export function bindTournamentCommands(client: Client) : Map<string, (interaction: ChatInputCommandInteraction) => void> {
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
        .setName(TURNAMENT_ID_OPTION_NAME)
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

export function getTournamentCommandHandlers() : Map<string, (interaction: ChatInputCommandInteraction) => void> {
    const handlers = new Map();

    handlers.set(ISCRIVITI_NAME, onIscriviti);
    handlers.set(DISISCRIVITI_NAME, onDisiscriviti);
    handlers.set(AGGIUNGI_TORNEO_NAME, onAggiungiTorneo);
    handlers.set(RIMUOVI_TORNEO_NAME, onRimuoviTorneo);
    handlers.set(AGGIORNA_NOME_TORNEO_NAME, onAggiornaNomeTorneo);
    handlers.set(AGGIOGRNA_DATA_NAME, onAggiornaDataOra);
    handlers.set(MOSTRA_GIOCATORI, onMostraPartecipanti);

    return handlers;
}

function onIscriviti(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION_NAME, true);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);
    
    if (tournament?.isPlayerPartecipating(interaction.user.id) === true) {
        interaction.reply({
            content: `Sei già iscritto al torneo **${tournament?.getName()}**`,
            ephemeral: true
        });
        return;
    }

    //TODO: Spostare la logica di iscrizione nel modal
    tournament?.addPlayer(interaction.user.id)

    const row1 =
        new TextInputBuilder()
        .setCustomId("rules")
        .setStyle(TextInputStyle.Short)
        .setLabel("Hai letto le regole?")
        .setRequired(true);

    const row2 =  new TextInputBuilder()
        .setLabel("Esperienza competitiva")
        .setPlaceholder("Inserisci la tua esperienza competitiva")
        .setCustomId("competive_experience")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);


    const actionRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(row1);
    const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(row2);

    const modal = new ModalBuilder()
        .setCustomId("iscrizione_torneo-"+interaction.options.getString(TURNAMENT_ID_OPTION_NAME))
        .setTitle("Iscriviti al torneo")
        .addComponents(actionRow1, actionRow2);

    interaction.showModal(modal);
}

function onMostraPartecipanti(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION_NAME);
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
    const id = interaction.options.getString(TURNAMENT_ID_OPTION_NAME, true);
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

function onModalIscriviti(interaction: ModalSubmitInteraction) {
    //TODO
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
    const id = interaction.options.getString(TURNAMENT_ID_OPTION_NAME, true);
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
    const id = interaction.options.getString(TURNAMENT_ID_OPTION_NAME, true);
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
    const id = interaction.options.getString(TURNAMENT_ID_OPTION_NAME, true);
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
