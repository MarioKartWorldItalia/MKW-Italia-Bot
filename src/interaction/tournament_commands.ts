import { Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption, TextInputBuilder, TextInputStyle, ModalBuilder, RestOrArray, ActionRowBuilder, ModalSubmitInteraction, Interaction, MessageFlags, Message, SendableChannels, Embed, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, MessagePayload, SlashCommandBooleanOption, ButtonInteraction, GuildMember, Role, InteractionCollector, InteractionEditReplyOptions, SlashCommandUserOption, Channel, underline, Emoji, EmbedField, bold, AutocompleteInteraction, ApplicationCommandChoicesData, ApplicationCommandOptionWithAutocompleteMixin } from "discord.js";
import { Tournament, TournamentManager } from "../tournament_manager/tournaments.js";
import { Application } from "../application.js";
import { log } from "console";
import { BotDefaults, Globals } from "../globals.js";
import moment from "moment-timezone";
import { replyEphemeral, standardDiscordTimeFormat } from "../utils.js";
import { ObjectId } from "mongodb";
import { BotDefaultsSchema, FriendCodesDbDefaults } from "../database/models/defaults.js";
import { assertCond } from "../logging/assert.js";
import { BotEmojis, EmojisManager } from "../emoijs_manager.js";
import { randomUUID } from "crypto";

const SETUP_BOT_NAME = "bot_setup";
const SETUP_BOT_MODAL_NAME = "bot_setup_modal";
const CLEAR_BOT_SETUP_NAME = "clear_bot_defaults"
const DEFAULT_TOURNAMENT_ROLE_ADD_OPTION = "default_role_add";
const ON_ISCRIVITI_CHANNEL_OPTION = "conferma_iscrizione"

const ADMIN_AGGIUNGI_GIOCATORE_NAME = "admin_aggiungi_giocatore";
const ADMIN_RIMUOVI_GIOCAORE_NAME = "admin_rimuovi_giocatore";
const USER_OPTION = "player_id";

const ISCRIVITI_NAME = "iscriviti";
const DISISCRIVITI_NAME = "disiscriviti";
const RIMUOVI_EVENTO_NAME = "rimuovi_evento";

const MOSTRA_EVENTO_NAME = "mostra_evento";

const MOSTRA_GIOCATORI_NAME = "mostra_partecipanti"
const AGGIUNGI_EVENTO_NAME = "aggiungi_evento";
const AGGIOGRNA_DATA_NAME = "aggiorna_data_evento";
const AGGIORNA_NOME_TORNEO_NAME = "aggiorna_nome_evento";
const AGGIUNGI_DETTAGLI_NAME = "aggiungi_dettagli";
const AGGIUNGI_DETTAGLI_MODAL_SUBMIT_NAME = "aggiungi_dettagli_submit";
const ORGANIZZATORI_OPTION = "organizzatori";

const IS_TOURNAMENT_OPTION = "evento_torneo";
const NOME_OPTION = "nome";

const DATA_ORA_OPTION = "data_ora";
const EPHEMERAL_OPTION = "ephemeral";

const CONFERMA_CANCELLAZIONE_NAME = "confirm_delete";

const ISCRIZIONE_TORNEO_MODAL_NAME = "modal_tournament_add_player"
const REGOLE_LETTE_OPTION = "rules"
const ESPERIENZA_COMPETITIVA_OPTION = "competitive_experience"
const TEAM_OPTION = "selected_team"

const TOURNAMENT_ID_OPTION = "evento";


export async function bindTournamentCommands(client: Client): Promise<Map<string, (interaction: Interaction) => Promise<void>>> {
    client.application?.commands.create(
        new SlashCommandBuilder()
            .setName(SETUP_BOT_NAME)
            .setDescription("Setup del bot")
            .toJSON()
    );
    client.application?.commands.create(
        new SlashCommandBuilder()
            .setName(CLEAR_BOT_SETUP_NAME)
            .setDescription("Reimposta i valori di defults del bot")
            .toJSON()
    )

    client.application?.commands.create(
        new SlashCommandBuilder()
            .setName(AGGIUNGI_EVENTO_NAME)
            .setDescription("Aggiungii un evento")
            .addBooleanOption(
                new SlashCommandBooleanOption()
                    .setName(IS_TOURNAMENT_OPTION)
                    .setDescription("True se è un torneo, altrimenti false")
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(NOME_OPTION)
                    .setDescription("Nome dell'evento")
                    .setRequired(true),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DATA_ORA_OPTION)
                    .setDescription("Data e ora dell'evento (YYYY-MM-DD HH:mm)")
                    .setRequired(true),
            )
            .toJSON(),
    );

    //Il log non è reliable
    //TODO: Aggiungere tutti i comandi aggiunti sopra ad un array di Promise ed utilizzare Promise.all(array).then(()=>log(...)).catch(logError e potenzialmente SIGTERM)
    refreshTournaments(await Application.getInstance().getTournamentManager().getTournaments()).then(() => log("Comandi torneo aggiornati"));

    return getTournamentCommandHandlers();;
}

export async function refreshTournaments(tournaments: Tournament[]) {
    let commands = Application.getInstance().getClient().application?.commands;
    let apiCalls = [];
    apiCalls.push(commands?.create(createTournamentsCommand(tournaments, MOSTRA_EVENTO_NAME, "Mostra l'evento in questo canale")));
    apiCalls.push(commands?.create(createTournamentsCommand(tournaments, ADMIN_AGGIUNGI_GIOCATORE_NAME, "ADMIN: Aggiungi un giocatore")
        .addUserOption(
            new SlashCommandUserOption()
                .setName(USER_OPTION)
                .setDescription("Il giocatore da aggiungere")
                .setRequired(true))))

    apiCalls.push(commands?.create(createTournamentsCommand(tournaments, ADMIN_RIMUOVI_GIOCAORE_NAME, "ADMIN: Rimuovi un giocatore")
        .addUserOption(
            new SlashCommandUserOption()
                .setName(USER_OPTION)
                .setDescription("Il giocatore da rimuovere")
                .setRequired(true)
        ).toJSON()));

    apiCalls.push(commands?.create(createTournamentsCommand(tournaments, ISCRIVITI_NAME, "Iscriviti ad un evento").toJSON()));
    apiCalls.push(commands?.create(createTournamentsCommand(tournaments, DISISCRIVITI_NAME, "Disiscriviti da un evento").toJSON()));
    apiCalls.push(commands?.create(createTournamentsCommand(tournaments, RIMUOVI_EVENTO_NAME, "Rimuovi un evento").toJSON()));
    apiCalls.push(commands?.create(createTournamentsCommand(tournaments, MOSTRA_GIOCATORI_NAME, "Mostra i giocatori partecipanti")
        .addBooleanOption(
            new SlashCommandBooleanOption()
                .setName(EPHEMERAL_OPTION)
                .setDescription("False se il messaggio non deve essere effimero")
                .setRequired(false)
        ).toJSON()));
    apiCalls.push(commands?.create(
        createTournamentsCommand(tournaments, AGGIORNA_NOME_TORNEO_NAME, "Aggiorna il nome di un torneo")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(NOME_OPTION)
                    .setDescription("Nuovo nome del torneo")
                    .setRequired(true)
            )
            .toJSON()
    ));
    apiCalls.push(commands?.create(
        createTournamentsCommand(tournaments, AGGIOGRNA_DATA_NAME, "Aggiorna la data e l'ora di un torneo")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(DATA_ORA_OPTION)
                    .setDescription("Nuova data e ora del torneo (YYYY-MM-DD HH:mm)")
                    .setRequired(true)
            )
            .toJSON()
    ));
    apiCalls.push(commands?.create(
        createTournamentsCommand(tournaments,
            AGGIUNGI_DETTAGLI_NAME,
            "Aggiungi ulteriori dettagli all'evento"
        )

    ));

    await Promise.all(apiCalls);
}

function createTournamentsCommand(tournaments: Tournament[], name: string, description: string): SlashCommandBuilder {
    let builder = new SlashCommandBuilder()
        .setName(name)
        .setDescription(description);

    let options = new SlashCommandStringOption()
        .setName(TOURNAMENT_ID_OPTION)
        .setDescription("Seleziona un evento")
        .setAutocomplete(true)
        .setRequired(true);

    // 


    //     options.addChoices({
    //         name: tournament.getName() + " - " + formatDay + " alle " + formatTime,
    //         value: id.toString()
    //     });
    // }

    builder.addStringOption(options);
    return builder;
}


// ------------- FUNZIONI HANDLER -----------------

export function getTournamentCommandHandlers() {
    const handlers = new Map();

    handlers.set(ADMIN_AGGIUNGI_GIOCATORE_NAME, onAdminAggiungiGiocatore);
    handlers.set(ADMIN_RIMUOVI_GIOCAORE_NAME, onAdminRimuoviGiocatore);
    handlers.set(SETUP_BOT_NAME, onBotSetup);
    handlers.set(SETUP_BOT_MODAL_NAME, onBotSetupModalSubmit);
    handlers.set(MOSTRA_EVENTO_NAME, onMostraTorneo)
    handlers.set(ISCRIVITI_NAME, onIscriviti);
    handlers.set(DISISCRIVITI_NAME, onDisiscriviti);
    handlers.set(AGGIUNGI_EVENTO_NAME, onAggiungiTorneo);
    handlers.set(RIMUOVI_EVENTO_NAME, onRimuoviTorneo);
    handlers.set(AGGIORNA_NOME_TORNEO_NAME, onAggiornaNomeTorneo);
    handlers.set(AGGIOGRNA_DATA_NAME, onAggiornaDataOra);
    handlers.set(MOSTRA_GIOCATORI_NAME, onMostraPartecipanti);
    handlers.set(ISCRIZIONE_TORNEO_MODAL_NAME, onModalIscriviti)
    handlers.set(CONFERMA_CANCELLAZIONE_NAME, onConfermaRimozioneTorneo)
    handlers.set(AGGIUNGI_DETTAGLI_NAME, onAggiungiDettagli);
    handlers.set(AGGIUNGI_DETTAGLI_MODAL_SUBMIT_NAME, onAggiungiDettagliModalSubmit);
    handlers.set(CLEAR_BOT_SETUP_NAME, onClearBotDefaults);

    return handlers;
}

async function onClearBotDefaults(interaction: Interaction) {
    await BotDefaults.clearDefaults();
    if (interaction.isRepliable()) {
        await interaction.reply("Valori del bot reimpostati");
    }
}

async function checkAndPopulateAutocomplete(interaction: Interaction): Promise<boolean> {
    if (!interaction.isAutocomplete()) {
        return false;
    }

    const acInteraction = interaction as AutocompleteInteraction;
    const tournaments = await Application.getInstance().getTournamentManager().getTournaments();
    let choices = [];

    for (const tournament of tournaments) {
        const id = tournament.getId() as ObjectId;

        const ts = tournament.getDateTime();
        const formatDay = ts.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
        const formatTime = ts.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

        choices.push(
            {
                name: `${tournament.getName()} | ${formatDay}-${formatTime}`,
                value: tournament.getId()!.toString()
            }
        );
    }
    await acInteraction.respond(choices);
    return true;
}

async function onBotSetup(interaction: Interaction) {
    //TODO: Spostare questo metodo in un altro file più appropriato(1)
    const options = [];

    options.push(new TextInputBuilder()
        .setCustomId(DEFAULT_TOURNAMENT_ROLE_ADD_OPTION)
        .setLabel("Ruolo da aggiungere")
        .setPlaceholder("ID ruolo iscrizione torneo")
        .setStyle(TextInputStyle.Short)
        .setRequired(false));

    options.push(new TextInputBuilder()
        .setCustomId(ON_ISCRIVITI_CHANNEL_OPTION)
        .setLabel("Conferma iscrizione torneo")
        .setPlaceholder("Dove vengono mandati i messaggi di conferma di iscrizione")
        .setStyle(TextInputStyle.Short)
        .setRequired(false));

    options.push(new TextInputBuilder()
        .setCustomId("friend_codes_channel")
        .setLabel("Canale codici amico")
        .setPlaceholder("Canale dove il bot manda i codici amico")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false));

    const actionRows = [];
    for (const option of options) {
        actionRows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(option).toJSON());
    }
    const modal = new ModalBuilder()
        .setCustomId(SETUP_BOT_MODAL_NAME)
        .setTitle("Bot setup")
        .addComponents(actionRows);

    if (interaction instanceof ChatInputCommandInteraction) {
        await interaction.showModal(modal);
    }
}

async function onAdminAggiungiGiocatore(interaction: Interaction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    if (!(interaction instanceof ChatInputCommandInteraction)) {
        throw new Error();
    }
    const castInteraction = interaction as ChatInputCommandInteraction;

    const user = castInteraction.options.getUser(USER_OPTION);
    if (!user) {
        await replyEphemeral(interaction, "Giocatore non valido");
        return;
    }

    // modifica la proprità user di interaction temporaneamente
    const originalUser = interaction.user;
    Object.defineProperty(interaction, 'user', { value: user, configurable: true, writable: true });

    await onIscriviti(interaction);
    Object.defineProperty(interaction, 'user', { value: originalUser, configurable: true, writable: true });
}

async function onAdminRimuoviGiocatore(interaction: Interaction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    if (!(interaction instanceof ChatInputCommandInteraction)) {
        throw new Error();
    }
    let castInteraction = interaction as ChatInputCommandInteraction;
    const user = castInteraction.options.getUser(USER_OPTION);

    const originalUser = interaction.user;
    Object.defineProperty(interaction, 'user', { value: user, configurable: true, writable: true });
    await onDisiscriviti(interaction as ChatInputCommandInteraction);
    Object.defineProperty(interaction, 'user', { value: originalUser, configurable: true, writable: true });
}

async function onBotSetupModalSubmit(interaction: Interaction) {
    let modalSubmit;
    if (interaction.isModalSubmit()) {
        modalSubmit = interaction as ModalSubmitInteraction;
    }

    const roleAdd = modalSubmit?.fields.getTextInputValue(DEFAULT_TOURNAMENT_ROLE_ADD_OPTION);
    const modalConfirmChannel = modalSubmit?.fields.getTextInputValue(ON_ISCRIVITI_CHANNEL_OPTION);
    const friendCodesChannel = modalSubmit?.fields.getTextInputValue("friend_codes_channel");

    //TODO: Spostare questo metodo in un altro file più appropriato(2)


    const defaults = new BotDefaultsSchema();
    if (roleAdd) {
        defaults.defaultTournamentRoleAdd = roleAdd;
    }

    if (modalConfirmChannel) {
        defaults.tournamentFormCompiledChannel = modalConfirmChannel;
    }

    if (friendCodesChannel) {
        let defaultFC = defaults.friendCodesDbDefaults;
        if (!defaultFC) {
            defaultFC = new FriendCodesDbDefaults();
        }
        defaults.friendCodesDbDefaults.channelId = friendCodesChannel;
    }

    await BotDefaults.setDefaults(defaults);
    if (interaction.isRepliable()) {
        await interaction.reply("Valori di defualt impostati");
    }
}

async function onMostraTorneo(interaction: Interaction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    if (!interaction.isChatInputCommand()) {
        throw new Error();
    }

    const channel = interaction.channel;
    const id = interaction.options.getString(TOURNAMENT_ID_OPTION)!;
    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);
    if (!tournament) {
        replyEphemeral(interaction, "Il torneo non esiste");
    }

    if (channel?.isSendable()) {
        await channel.send(await createTournamentMessage(tournament!));
    }

}

async function onIscriviti(interaction: Interaction) {
    if (interaction.isAutocomplete()) {
        checkAndPopulateAutocomplete(interaction);
        return;
    }

    let id = "";
    if (interaction instanceof ChatInputCommandInteraction) {
        id = interaction.options.getString(TOURNAMENT_ID_OPTION, true);
    }
    else if (interaction instanceof ButtonInteraction) {
        id = interaction.customId.split(" ")[1];
    }
    else {
        throw new TypeError();
    }

    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(new ObjectId(id));

    if (!tournament) {
        if (interaction.isRepliable()) {
            await interaction.reply({
                content: "Errore, torneo non trovato",
                flags: MessageFlags.Ephemeral
            })
        }
        return;
    }

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
        .setCustomId("display_name")
        .setLabel("Nome in game")
        .setPlaceholder("Inserisci il tuo nome in game (lo stesso della console)")
        .setStyle(TextInputStyle.Short)
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
    const modal = new ModalBuilder()
        .setCustomId(`${ISCRIZIONE_TORNEO_MODAL_NAME} ${id}`)
        .setTitle("Iscriviti al torneo")
        .addComponents(actionRow1, actionRow2, actionRow3, actionRow4);

    interaction.showModal(modal);
}

async function onMostraPartecipanti(interaction: ChatInputCommandInteraction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    const id = interaction.options.getString(TOURNAMENT_ID_OPTION);
    let ephemeralOption = interaction.options.getBoolean(EPHEMERAL_OPTION);
    if (ephemeralOption == null) {
        ephemeralOption = true;
    }

    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(new ObjectId(id || ""));



    const players = tournament?.getPlayers() ?? [];
    const response = players.length > 0
        ? players
            .sort((a, b) => a.joinDateTime.getTime() - b.joinDateTime.getTime())
            .map((player) => `<@${player.playerId}> - ${player.displayName}`).join('\n')
        : "Nessun partecipante al torneo.";


    interaction.reply({
        content: `Partecipanti al torneo **${tournament?.getName()}**:\n${response}`,
        ephemeral: ephemeralOption
    });
}

async function onDisiscriviti(interaction: ChatInputCommandInteraction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    const id = interaction.options.getString(TOURNAMENT_ID_OPTION, true);
    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(new ObjectId(id));

    if (!tournament) {
        replyEphemeral(interaction, "Torneo non trovato");
        return;
    }

    if (tournament?.isPlayerPartecipating(interaction.user.id) === false) {
        interaction.reply({
            content: `Non sei iscritto al torneo **${tournament?.getName()}**`,
            ephemeral: true
        });
        return;
    }

    tournament?.removePlayer(interaction.user.id);
    Application.getInstance().getTournamentManager().updateTournament(tournament);

    const roleRemove = (await BotDefaults.getDefaults()).defaultTournamentRoleAdd;
    if (roleRemove != "") {
        const role = await interaction.guild?.roles.fetch(roleRemove);
        if (interaction.member instanceof GuildMember
            && role instanceof Role
        ) {
            await interaction.member.roles.remove(role);
        }
    }

    interaction.reply({
        content: `Ti sei disiscritto dal torneo **${tournament?.getName()}**`,
        ephemeral: true
    });

    const confirmChannelId = (await BotDefaults.getDefaults()).tournamentFormCompiledChannel;
    if (confirmChannelId != "") {
        const confirmChannel = await interaction.guild?.channels.fetch(confirmChannelId) as Channel;
        if (confirmChannel?.isTextBased() && confirmChannel?.isSendable()) {
            const embed = new EmbedBuilder()
                .setTitle("Disiscrizione torneo")
                .setColor(Colors.Red)
                .setDescription(`L'utente <@${interaction.user.id}> si è disiscritto dal torneo **${tournament?.getName()}**`)
                .setTimestamp(new Date())
                .setThumbnail(interaction.user.displayAvatarURL());
            await confirmChannel.send({ embeds: [embed] });
        }
    }
}

async function onAggiungiDettagli(interaction: Interaction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    let castInteraction!: ChatInputCommandInteraction;
    if (interaction instanceof ChatInputCommandInteraction) {
        castInteraction = interaction as ChatInputCommandInteraction;
    }

    const tournamentIdOption = castInteraction.options.getString(TOURNAMENT_ID_OPTION);
    const modal = new ModalBuilder()
        .setCustomId(`${AGGIUNGI_DETTAGLI_MODAL_SUBMIT_NAME} ${tournamentIdOption}`)
        .setTitle("Aggiungi ulteriori informazioni")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>()
                .addComponents(
                    new TextInputBuilder()
                        .setCustomId("2BracketDate")
                        .setLabel("Data secondo girone")
                        .setPlaceholder("Inserisci la data del secondo girone (YYYY-MM-DD HH:mm)")
                        .setRequired(false)
                        .setStyle(TextInputStyle.Short)
                ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("mode")
                    .setLabel("Modalità")
                    .setRequired(false)
                    .setPlaceholder("Modalità del torneo (FFA/squad, etc.)")
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("nRaces")
                    .setLabel("Numero di corse")
                    .setPlaceholder("Numero di corse del torneo")
                    .setRequired(false)
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("minMaxPlayers")
                    .setLabel("Minimo e massimo giocatori")
                    .setPlaceholder("Minimo e massimo giocatori (es. 8-16), 0 per nessun limite")
                    .setRequired(false)
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId(ORGANIZZATORI_OPTION)
                    .setLabel("Organizzatori")
                    .setRequired(false)
                    .setPlaceholder("organizzatoreId/@organizzatoreUsername FC")
                    .setStyle(TextInputStyle.Paragraph)
            )

        );
    await castInteraction.showModal(modal);
}

async function onAggiungiDettagliModalSubmit(interaction: Interaction) {
    const tManager = Application.getInstance().getTournamentManager();
    const castInteraction = interaction as ModalSubmitInteraction;
    const tournamentId = castInteraction.customId.split(" ")[1];
    const bracket2Date = castInteraction.fields.getTextInputValue("2BracketDate");
    const rawEventPlanners = castInteraction.fields.getTextInputValue(ORGANIZZATORI_OPTION);
    const minMaxPlayers = castInteraction.fields.getTextInputValue("minMaxPlayers");
    const nRaces = castInteraction.fields.getTextInputValue("nRaces");
    const mode = castInteraction.fields.getTextInputValue("mode");

    const tournament = await tManager.getTournamentById(tournamentId);

    if (!tournament) {
        replyEphemeral(interaction, "Torneo non trovato");
        return;
    }

    if (bracket2Date != "") {
        const dateTime = moment.tz(bracket2Date, Globals.STANDARD_TIMEZONE).toDate();

        if (isNaN(dateTime.valueOf())) {
            replyEphemeral(interaction, "Data del secondo girone non valida");
            return;
        }
        tournament.setSecondBracketDate(dateTime);
    }

    if (mode != "") {
        tournament.setMode(mode);
    }

    if (nRaces != "") {
        const nRacesInt = parseInt(nRaces);
        if (isNaN(nRacesInt) || nRacesInt <= 0) {
            replyEphemeral(interaction, "Numero di corse non valido");
            return;
        }
        tournament.setNumberOfRaces(nRacesInt);

    }

    if (minMaxPlayers != "") {
        const split = minMaxPlayers.split("-");
        if (split.length != 2) {
            replyEphemeral(interaction, "Minimo e massimo giocatori non valido");
            return;
        }
        const min = parseInt(split[0]);
        const max = parseInt(split[1]);
        if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || (max != 0 && min > max)) {
            replyEphemeral(interaction, "Minimo e massimo giocatori non valido");
            return;
        }
        if (min != 0) {
            tournament.setMinPlayers(min);
        }
        if (max != 0) {
            tournament.setMaxPlayers(max);
        }
    }

    if (rawEventPlanners != "") {
        const rows = rawEventPlanners.split("\n");
        for (const row of rows) {
            const split = row.split(" ");
            let user = split[0];
            if (user.startsWith("@")) {
                const fetchUser = interaction.guild?.members.cache.find((m) => m.user.username == user.slice(1));
                if (fetchUser) {
                    user = fetchUser.id;
                }
                else {
                    replyEphemeral(interaction, `${user} non esiste`);
                    return;
                }
            }
            if (!await interaction.guild?.members.fetch(user)) {
                replyEphemeral(interaction, "Utente non trovato");
                return;
            }

            let fc = "";
            if (split.length >= 1) {
                fc = split[1];
            }
            tournament.addEventPlanner(user, fc);
        }
    }

    await tManager.updateTournament(tournament);
    await replyEphemeral(interaction, "Informazioni del torneo aggiornate");

}

async function onModalIscriviti(interaction: Interaction) {
    const castInteraction = interaction as ModalSubmitInteraction;
    const id = castInteraction.customId.split(" ")[1];
    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

    if (!tournament) {
        await replyEphemeral(interaction, "Torneo non trovato");
        return;
    }

    const displayName = castInteraction.fields.getTextInputValue("display_name");
    tournament.addPlayer(interaction.user.id, displayName);
    Application.getInstance().getTournamentManager().updateTournament(tournament);

    const roleAdd = (await BotDefaults.getDefaults()).defaultTournamentRoleAdd;
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

    const channel = (await BotDefaults.getDefaults()).tournamentFormCompiledChannel;
    assertCond(channel !== undefined);

    if (channel) {
        const sendTo = await Application.getInstance().getClient().channels.fetch(channel);
        if (sendTo && sendTo.isSendable()) {
            let embed = new EmbedBuilder()
                .setTitle("Nuova iscrizione")
                .setDescription(`<@${interaction.user.id}> si è iscritto al torneo **${tournament.getName()}**`)
                .setColor(Globals.STANDARD_HEX_COLOR)
                .setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.username });
            //.setThumbnail(interaction.user.displayAvatarURL());

            for (const field of castInteraction.fields.fields) {
                if (field[1].customId == "" || field[1].customId == undefined) {
                    continue;
                }

                let name = field[1].customId.split("_");
                name[0] = name[0].charAt(0).toUpperCase() + name[0].slice(1);
                const nameStr = name.join(" ");
                embed.addFields({
                    name: nameStr,
                    value: field[1].customId,
                    inline: true
                })
            }
            sendTo.send({ embeds: [embed] });
        }
    }


    log(`Giocatore ${interaction.user.id} iscritto al torneo ${tournament?.getName()}(${id})`)
}

async function onAggiungiTorneo(interaction: ChatInputCommandInteraction) {
    const isTournament = interaction.options.getBoolean(IS_TOURNAMENT_OPTION, true);
    const name = interaction.options.getString(NOME_OPTION, true);
    const dateTimeUnaparsed = interaction.options.getString(DATA_ORA_OPTION, true);
    const dateTime = moment.tz(dateTimeUnaparsed, Globals.STANDARD_TIMEZONE).toDate();

    if (isNaN(dateTime.valueOf())) {
        await interaction.reply({
            content: `La data e ora fornita non sono valide. Usa il formato YYYY-MM-DD HH:mm.`,
            ephemeral: true
        });
        return;
    }

    const tournament = new Tournament(dateTime, name);
    tournament.isTournament = isTournament;
    const otherTournaments = await Application.getInstance().getTournamentManager().getTournaments();

    if (otherTournaments.find(
        (v) => v.getName().toLowerCase() === tournament.getName().toLowerCase())) {

        await interaction.editReply("Esiste già un torneo con questo nome");
        return;
    }


    await Application.getInstance().getTournamentManager().addTournament(tournament);

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

    await interaction.showModal(descriptionModal);
    const response = await interaction.awaitModalSubmit({ time: 1000 * 60 * 5 });
    if (response.customId === descriptionModalUUID) {
        const description = response.fields.getTextInputValue("description");
        if (description && description != "") {
            tournament.setDescription(description);
            await Application.getInstance().getTournamentManager().updateTournament(tournament);
        }
    }
    await response.reply(`Evento **${tournament.getName()}** aggiunto con successo!`);
}

async function onConfermaRimozioneTorneo(interaction: ButtonInteraction) {
    await interaction.deferReply();
    await interaction.message.removeAttachments();


    const choiceBool = interaction.customId.split(" ")[1].toLowerCase() == "true";

    if (choiceBool) {
        const tournamentId = interaction.customId.split(" ")[2];
        const tManager = Application.getInstance().getTournamentManager();
        const tournament = await tManager.getTournamentById(tournamentId);

        const msg = interaction.message;
        if (msg && msg.deletable) {
            msg.delete();
        }

        if (!tournament) {
            interaction.editReply(`Il torneo con id **${tournamentId}** non è stato trovato`);
            return;
        }

        await tManager.removeTournament(tournament);

        await interaction.editReply(`Il torneo "**${tournament.getName()}"** con id: **${tournament.getId()}** è stato eliminato`);
        return;
    }

    else {
        let msg = interaction.message;
        if (msg && msg.deletable) {
            msg.delete();
        }
        interaction.deleteReply();
    }
}

async function onRimuoviTorneo(interaction: ChatInputCommandInteraction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    const id = interaction.options.getString(TOURNAMENT_ID_OPTION, true);
    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

    if (!tournament) {
        interaction.reply({
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

    interaction.reply(
        {
            content: `Sei sicuro di voler eliminare il torneo "${tournament.getName()}"? (id: ${tournament.getId()})`,
            components: buttons,
        }
    )
}

async function onAggiornaNomeTorneo(interaction: ChatInputCommandInteraction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const id = interaction.options.getString(TOURNAMENT_ID_OPTION, true);
    const newName = interaction.options.getString(NOME_OPTION, true);
    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

    //controlla che non ci siano tonrei identici
    const otherTournaments = await Application.getInstance().getTournamentManager().getTournaments();
    if (otherTournaments.find(
        (t) => t.getName().toLowerCase() === newName.toLowerCase())
    ) {
        interaction.reply("Non puoi utilizzare lo stesso nome di un alro torneo");
        return;
    }


    tournament?.setName(newName);
    if (tournament) {
        await Application.getInstance().getTournamentManager().updateTournament(tournament);
    }

    await refreshTournaments(await Application.getInstance().getTournamentManager().getTournaments());
    interaction.editReply({
        content: `Il nome del torneo **${id}** è stato aggiornato a **${newName}**`,
    });

}

async function onAggiornaDataOra(interaction: ChatInputCommandInteraction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const id = interaction.options.getString(TOURNAMENT_ID_OPTION, true);
    const newDateTime = interaction.options.getString(DATA_ORA_OPTION, true);
    const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

    let date = new Date(newDateTime);
    if (isNaN(date.getTime())) {
        interaction.editReply({
            content: `La data e ora fornita non sono valide. Usa il formato YYYY-MM-DD HH:mm.`,
        });
        return;
    }

    tournament?.setDateTime(date);
    if (tournament) {
        await Application.getInstance().getTournamentManager().updateTournament(tournament);
    }

    interaction.editReply({
        content: `La data e ora del torneo **${id}** sono state aggiornate a **${date.toISOString()}**`,
    });
}

async function createTournamentMessage(tournament: Tournament) {
    const arrow = await EmojisManager.getEmoji(BotEmojis.FRECCIA_MINORE);

    function createField(fieldName: string, msg: string) {
        let splitMsg = msg.split("\n");
        const mapped = splitMsg.map((v) => {
            if (v != "") {
                return "> " + v
            }
            else {
                return "";
            }
        });
        const newMsg = mapped.join("\n");

        return {
            name: `${arrow} ${fieldName}`,
            value: `${newMsg}`
        } as EmbedField
    }

    const bandierina = await EmojisManager.getEmoji(BotEmojis.BANDIERINA);
    const eventOrTournament = tournament.isTournament ? "Torneo" : "Evento";

    const title = `${bandierina} ${eventOrTournament} - ${tournament.getName()} - ${standardDiscordTimeFormat(tournament.getDateTime())}`;
    const embed = new EmbedBuilder()
        .setColor(Globals.STANDARD_HEX_COLOR)
        .setDescription("# " + `__**${title}**__`);
    if (tournament.getDescription()) {
        embed.addFields(createField("Descrizione", tournament.getDescription()!));
    }

    if (tournament.getMode()) {
        embed.addFields(createField("Modalità", tournament.getMode() as string));
    }

    if (tournament.getMinPlayers() || tournament.getMaxPlayers()) {
        let minMax = "";
        if (tournament.getMinPlayers()) {
            minMax += `Minimo giocatori: ${tournament.getMinPlayers()}\n`;
        }
        if (tournament.getMaxPlayers()) {
            minMax += `Massimo giocatori: ${tournament.getMaxPlayers()}\n`;
        }
        embed.addFields(createField("Giocatori", minMax));
    }

    if (tournament.getNumberOfRaces()) {
        embed.addFields(createField("Numero di corse", tournament.getNumberOfRaces()!.toString()));
    }

    if (tournament.getSecondBracketDate()) {
        embed.addFields(createField("Data secondo girone", standardDiscordTimeFormat(tournament.getSecondBracketDate() as Date)));
    }

    const eventPlanners = tournament.getEventPlanners();
    if (eventPlanners.size > 0) {
        let append = "";
        let msg = "";
        for (const planner of eventPlanners) {
            msg += append;
            msg += `<@${planner[0]}>`;

            if (planner[1]) {
                msg += ` - ${planner[1]}`;
            }
            msg += "\n";
        }
        embed.addFields(createField("Organizzatori", msg));
    }

    const iscrivitiBtn = new ButtonBuilder()
        .setCustomId(ISCRIVITI_NAME + " " + tournament.getId())
        .setLabel("Iscriviti")
        .setStyle(ButtonStyle.Primary);

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(iscrivitiBtn);

    return {
        embeds: [embed],
        components: [components]
    };
}
