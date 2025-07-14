import { Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption, TextInputBuilder, TextInputStyle, ModalBuilder, RestOrArray, ActionRowBuilder, ModalSubmitInteraction, Interaction, MessageFlags, Message, SendableChannels, Embed, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, MessagePayload, SlashCommandBooleanOption, ButtonInteraction, GuildMember, Role } from "discord.js";
import { Tournament } from "../tournaments.js";
import { Application } from "../application.js";
import { get, maxHeaderSize } from "http";
import { log } from "console";
import { Globals } from "../globals.js";
import { assertCond } from "../logging/assert.js";

const ISCRIVITI_NAME = "iscriviti";
const DISISCRIVITI_NAME = "disiscriviti";
const RIMUOVI_TORNEO_NAME = "rimuovi_torneo";

const MOSTRA_GIOCATORI_NAME = "mostra_giocatori"
const AGGIUNGI_TORNEO_NAME = "aggiungi_torneo";
const AGGIOGRNA_DATA_NAME = "aggiorna_data_torneo";
const AGGIORNA_NOME_TORNEO_NAME = "aggiorna_nome_torneo";
const NOME_OPTION = "nome";
const DATA_ORA_OPTION = "data_ora";
const EPHEMERAL_OPTION = "ephemeral";

const CONFERMA_CANCELLAZIONE_NAME = "confirm_delete";

const ISCRIZIONE_TORNEO_MODAL_NAME = "modal_tournament_add_player"
const REGOLE_LETTE_OPTION = "rules"
const ESPERIENZA_COMPETITIVA_OPTION = "competitive_experience"

const TURNAMENT_ID_OPTION = "torneo";


export function bindTournamentCommands(client: Client): Map<string, (interaction: Interaction) => Promise<void>> {
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
    commands?.create(createTournamentsCommand(tournaments, MOSTRA_GIOCATORI_NAME, "Mostra i giocatori partecipanti")
        .addBooleanOption(
            new SlashCommandBooleanOption()
                .setName(EPHEMERAL_OPTION)
                .setDescription("False se il messaggio non deve essere effimero")
                .setRequired(false)
        ).toJSON());
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

export function getTournamentCommandHandlers() {
    const handlers = new Map();

    handlers.set(ISCRIVITI_NAME, onIscriviti);
    handlers.set(DISISCRIVITI_NAME, onDisiscriviti);
    handlers.set(AGGIUNGI_TORNEO_NAME, onAggiungiTorneo);
    handlers.set(RIMUOVI_TORNEO_NAME, onRimuoviTorneo);
    handlers.set(AGGIORNA_NOME_TORNEO_NAME, onAggiornaNomeTorneo);
    handlers.set(AGGIOGRNA_DATA_NAME, onAggiornaDataOra);
    handlers.set(MOSTRA_GIOCATORI_NAME, onMostraPartecipanti);
    handlers.set(ISCRIZIONE_TORNEO_MODAL_NAME, onModalIscriviti)
    handlers.set(CONFERMA_CANCELLAZIONE_NAME, onConfermaRimozioneTorneo)

    return handlers;
}

async function onIscriviti(interaction: Interaction) {
    let id = "";
    if (interaction instanceof ChatInputCommandInteraction) {
        id = interaction.options.getString(TURNAMENT_ID_OPTION, true);
    }
    else if (interaction instanceof ButtonInteraction) {
        id = interaction.customId.split(" ")[1];
    }
    else {
        throw new TypeError();
    }

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

    const row2 = new TextInputBuilder()
        .setCustomId(ESPERIENZA_COMPETITIVA_OPTION)
        .setLabel("Esperienza competitiva")
        .setPlaceholder("Inserisci la tua esperienza competitiva")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);


    const actionRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(row1);
    const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(row2);

    const modal = new ModalBuilder()
        .setCustomId(`${ISCRIZIONE_TORNEO_MODAL_NAME} ${id}`)
        .setTitle("Iscriviti al torneo")
        .addComponents(actionRow1, actionRow2);

    interaction.showModal(modal);
}

async function onMostraPartecipanti(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION);
    let ephemeralOption = interaction.options.getBoolean(EPHEMERAL_OPTION);
    if (ephemeralOption == null) {
        ephemeralOption = true;
    }

    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id || "");



    const players = tournament?.getPlayers() ?? [];
    const response = players.length > 0
        ? players.map((playerId: string) => `<@${playerId}>`).join('\n')
        : "Nessun partecipante al torneo.";


    interaction.reply({
        content: `Partecipanti al torneo **${tournament?.getName()}**:\n${response}`,
        ephemeral: ephemeralOption
    });
}

async function onDisiscriviti(interaction: ChatInputCommandInteraction) {
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

    const roleRemove = Globals.DEBUG_TOURNAMENT_ROLE_ADD;
    if (roleRemove != "") {
        const role = await interaction.guild?.roles.fetch(roleRemove);
        if (interaction.member instanceof GuildMember
            && role instanceof Role
        ) {
            interaction.member.roles.remove(role);
        }
    }

    interaction.reply({
        content: `Ti sei disiscritto dal torneo **${tournament?.getName()}**`,
        ephemeral: true
    });
}

async function onModalIscriviti(interaction: Interaction) {
    const castInteraction = interaction as ModalSubmitInteraction;
    const id = castInteraction.customId.split(" ")[1];
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);
    tournament?.addPlayer(interaction.user.id);

    const roleAdd = Globals.DEBUG_TOURNAMENT_ROLE_ADD;
    if (roleAdd != "") {
        const role = await interaction.guild?.roles.fetch(roleAdd);
        if (interaction.member instanceof GuildMember
            && role instanceof Role
        ) {
            await interaction.member.roles.add(role);
        }
    }

    await castInteraction.reply(
        {
            content: "Iscrizione completata con successo",
            flags: MessageFlags.Ephemeral
        }
    );

    log(`Giocatore ${interaction.user.id} iscritto al torneo ${tournament?.getName()}(${id})`)
}

async function onAggiungiTorneo(interaction: ChatInputCommandInteraction) {
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


    const channel = interaction.channel;

    if (channel?.isSendable()) {
        const retMsg = await channel.send(await createTournamentMessage(tournament));
        // retMsg.then((val) => tournament.setServerMessage(val));
    }
    else {
        log(`ERRORE: Impossibile mandare messaggi al canale ${channel}`)
    }

    refreshTournaments(Application.getInstance().getTournamentManager().tournaments);
}

async function onConfermaRimozioneTorneo(interaction: ButtonInteraction) {
    const choiceBool = interaction.customId.split(" ")[1].toLowerCase() == "true";

    if (choiceBool) {
        const tournamentId = interaction.customId.split(" ")[2];
        const tManager = Application.getInstance().getTournamentManager();
        const tournament = tManager.getTournamentById(tournamentId);

        if (!tournament) {
            interaction.reply(
                {
                    content: `Il torneo con id **${tournamentId} non è stato trovato`,
                    flags: MessageFlags.Ephemeral
                }
            )
            return;
        }

        tManager.removeTournament(tournament);
        refreshTournaments(tManager.getTournaments());
        interaction.reply(`Il torneo "**${tournament.getName()}"** con id: **${tournament.getUuid()}** è stato eliminato`);
        return;
    }

    else {
        let msg = interaction.message;
        if (msg && msg.deletable) {
            msg.delete();
        }
    }
}

async function onRimuoviTorneo(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString(TURNAMENT_ID_OPTION, true);
    const tournament = Application.getInstance().getTournamentManager().getTournamentById(id);

    if (!tournament) {
        interaction.reply({
            content: `Torneo con ID **${id}** non trovato.`,
            ephemeral: true
        });
        return;
    }

    const confirm = new ButtonBuilder()
        .setCustomId(`${CONFERMA_CANCELLAZIONE_NAME} true ${tournament.getUuid()}`)
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

    interaction.reply(
        {
            content: `Sei sicuro di voler eliminare il torneo "${tournament.getName()}"? (id: ${tournament.getUuid()})`,
            components: buttons,
        }
    )

    refreshTournaments(Application.getInstance().getTournamentManager().getTournaments());
}

async function onAggiornaNomeTorneo(interaction: ChatInputCommandInteraction) {
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

async function onAggiornaDataOra(interaction: ChatInputCommandInteraction) {
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

async function createTournamentMessage(tournament: Tournament) {
    const ts = tournament.getDateTime();
    const formatDay = ts.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
    const formatTime = ts.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    const embed = new EmbedBuilder()
        .setTitle(tournament.getName())
        .addFields(
            {
                name: "Data",
                value: formatDay
            },
            {
                name: "Ora",
                value: formatTime
            }

        )
        .setColor(Colors.Aqua);

    const iscrivitiBtn = new ButtonBuilder()
        .setCustomId(ISCRIVITI_NAME + " " + tournament.getUuid())
        .setLabel("Iscriviti")
        .setStyle(ButtonStyle.Primary);

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(iscrivitiBtn);

    return {
        embeds: [embed],
        components: [components]
    };
}