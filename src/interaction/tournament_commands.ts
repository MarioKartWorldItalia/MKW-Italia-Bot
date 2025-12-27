import { Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption, TextInputBuilder, TextInputStyle, ModalBuilder, RestOrArray, ActionRowBuilder, ModalSubmitInteraction, Interaction, MessageFlags, Message, SendableChannels, Embed, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, MessagePayload, SlashCommandBooleanOption, ButtonInteraction, GuildMember, Role, InteractionCollector, InteractionEditReplyOptions, SlashCommandUserOption, Channel, underline, Emoji, EmbedField, bold, AutocompleteInteraction, ApplicationCommandChoicesData, ApplicationCommandOptionWithAutocompleteMixin, SlashCommandIntegerOption, CategoryChannel, ChannelType } from "discord.js";
import { Tournament, TournamentManager } from "../tournament_manager/tournaments.js";
import { Application } from "../application.js";
import { log } from "console";
import { BotDefaults, Globals } from "../globals.js";
import moment from "moment-timezone";
import { replyEphemeral, standardDiscordTimeFormat } from "../utils.js";
import { ObjectId } from "mongodb";
import { BotDefaultsSchema, FriendCodesDbDefaults } from "../database/models/defaults.js";
import { assertCond, AssertError } from "../assert.js";
import { BotEmojis, EmojisManager } from "../emoijs_manager.js";
import { randomUUID } from "crypto";
import { Iscriviti, IscrivitiBtn } from "./tournament_commands/iscriviti.js";

export async function removeTournamentThread(t: Tournament) {
    const guild = await Application.getInstance().getMainGuild();
    const channelId = t.tournamentChannelId;
    if(!channelId) {
        return;
    }
    const channel = await guild.channels.fetch(channelId);
    if(!channel) {
        return;
    }
    await channel?.delete();
}

export async function updateTournamentName(t: Tournament) {
    const guild = await Application.getInstance().getMainGuild();
    const channelId = t.tournamentChannelId;
    const channel = await guild.channels.fetch(channelId!);
    const rawDate = t.getDateTime();
    const formatDate = moment(rawDate).format('DD-MM-YYYY');
    
    let newName = `${t.getName()} - ${formatDate}`;
    await channel?.setName(newName);
}


const SETUP_BOT_MODAL_NAME = "bot_setup_modal";
const DEFAULT_TOURNAMENT_ROLE_ADD_OPTION = "default_role_add";
const ON_ISCRIVITI_CHANNEL_OPTION = "conferma_iscrizione"

const ADMIN_AGGIUNGI_GIOCATORE_NAME = "admin_aggiungi_giocatore";
const ADMIN_RIMUOVI_GIOCAORE_NAME = "admin_rimuovi_giocatore";


const DISISCRIVITI_NAME = "disiscriviti";
const RIMUOVI_EVENTO_NAME = "rimuovi_evento";

const MOSTRA_EVENTO_NAME = "mostra_evento";

const MOSTRA_GIOCATORI_NAME = "mostra_partecipanti"
const AGGIUNGI_EVENTO_NAME = "aggiungi_evento";
const AGGIOGRNA_DATA_NAME = "aggiorna_data_evento";
const AGGIORNA_NOME_TORNEO_NAME = "aggiorna_nome_evento";
const AGGIUNGI_DETTAGLI_NAME = "aggiungi_dettagli";

const NOME_OPTION = "nome";

const MODE_OPTION = "modalità"

const DATA_ORA_OPTION = "data_ora_primo_girone";
const DATA_ORA_2_BRACKET_OPTION = "data_ora_secondo_girone";
const EPHEMERAL_OPTION = "ephemeral";

const CONFERMA_CANCELLAZIONE_NAME = "confirm_delete";

const ISCRIZIONE_TORNEO_MODAL_NAME = "modal_tournament_add_player"
const REGOLE_LETTE_OPTION = "rules"
const ESPERIENZA_COMPETITIVA_OPTION = "competitive_experience"
const TEAM_OPTION = "selected_team"

const TOURNAMENT_ID_OPTION = "evento";


export async function bindTournamentCommands(client: Client): Promise<Map<string, (interaction: Interaction) => Promise<void>>> {

    //TODO: Aggiungere tutti i comandi aggiunti sopra ad un array di Promise ed utilizzare Promise.all(array).then(()=>log(...)).catch(logError e potenzialmente SIGTERM)
    return getTournamentCommandHandlers();
}



// ------------- FUNZIONI HANDLER -----------------

export function getTournamentCommandHandlers() {
    const handlers = new Map();

    handlers.set(ADMIN_AGGIUNGI_GIOCATORE_NAME, onAdminAggiungiGiocatore);
    handlers.set(ADMIN_RIMUOVI_GIOCAORE_NAME, onAdminRimuoviGiocatore);
    handlers.set(MOSTRA_EVENTO_NAME, onMostraTorneo)
    handlers.set(AGGIOGRNA_DATA_NAME, onAggiornaDataOra);
    handlers.set(MOSTRA_GIOCATORI_NAME, onMostraPartecipanti);
    handlers.set(ISCRIZIONE_TORNEO_MODAL_NAME, onModalIscriviti)
    handlers.set("checkin", onCheckin);

    return handlers;
}

export async function checkAndPopulateAutocomplete(interaction: Interaction): Promise<boolean> {
    if (!interaction.isAutocomplete()) {
        return false;
    }

    const acInteraction = interaction as AutocompleteInteraction;
    const tournaments = await Application.getInstance().getTournamentManager().getTournaments();
    let choices = [];

    for (const tournament of tournaments) {
        const ts = tournament.getDateTime();
        const formatDay = moment(ts).format('DD-MM-YYYY');
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

async function onAdminAggiungiGiocatore(interaction: Interaction) {
 
}

async function onAdminRimuoviGiocatore(interaction: Interaction) {
    if (await checkAndPopulateAutocomplete(interaction)) {
        return;
    }

    if (!(interaction instanceof ChatInputCommandInteraction)) {
        throw new Error();
    }
    let castInteraction = interaction as ChatInputCommandInteraction;
    const user = castInteraction.options.getUser("USER_OPTION");

    const originalUser = interaction.user;
    Object.defineProperty(interaction, 'user', { value: user, configurable: true, writable: true });
  //  await onDisiscriviti(interaction as ChatInputCommandInteraction);
    throw new Error("uncomment the line above");  
  Object.defineProperty(interaction, 'user', { value: originalUser, configurable: true, writable: true });
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
    await Application.getInstance().getTournamentManager().updateTournament(tournament);

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
                .setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.username })
                .setTimestamp(new Date());
            //.setThumbnail(interaction.user.displayAvatarURL());

            embed.addFields([
                { name: "Nome in game", value: displayName, inline: true },
                { name: "Regole lette", value: castInteraction.fields.getTextInputValue(REGOLE_LETTE_OPTION), inline: true },
                { name: "Esperienza competitiva", value: castInteraction.fields.getTextInputValue(ESPERIENZA_COMPETITIVA_OPTION) || "N/A", inline: false },
                { name: "Squadra", value: castInteraction.fields.getTextInputValue(TEAM_OPTION) || "N/A", inline: true },
            ])
            sendTo.send({ embeds: [embed] });
        }
    }

    log(`Giocatore ${interaction.user.id} iscritto al torneo ${tournament?.getName()}(${id})`)
    await updateTournamentTable(tournament);
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

    const title = `${bandierina} ${tournament.getName()} - ${standardDiscordTimeFormat(tournament.getDateTime())}`;
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

    const iscrivitiBtn = new IscrivitiBtn(tournament._id!.toString()).createButton();

    const disiscrivitiBtn = new ButtonBuilder()
        .setCustomId(DISISCRIVITI_NAME + " " + tournament.getId())
        .setLabel("Disiscriviti")
        .setStyle(ButtonStyle.Danger);

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(iscrivitiBtn, disiscrivitiBtn);

    return {
        embeds: [embed],
        components: [components]
    };
}

export async function updateTournamentTable(tournament: Tournament) {
    const guild = await Application.getInstance().getMainGuild();
    const channelId = tournament.tournamentChannelId;
    const channel = await guild.channels.fetch(channelId!);

    let msg = "";
    if (tournament.getPlayers().length == 0) {
        msg = "Nessun giocatore iscritto al torneo.";
    }
    else {
        const players = tournament.getPlayers();
        msg = `Giocatori iscritti all'evento **${tournament.getName()}**:\n`;
        for (const player of players) {
            const checkedIn = player.checkedIn ? await EmojisManager.getEmoji(BotEmojis.SPUNTA) : ""
            msg += `> <@${player.playerId}> (${player.displayName})${checkedIn}\n`;
        }
    }


    if (!tournament.tableMsgId) {
        if (channel?.isSendable()) {
            const sentMsg = await channel.send(msg);
            tournament.tableMsgId = sentMsg.id;
            await Application.getInstance().getTournamentManager().updateTournament(tournament);
        }
    }
    else {
        if (channel?.isTextBased()) {
            let table = await channel.messages.fetch(tournament.tableMsgId!);
            await table.edit(msg);
        }
    }
}

async function onCheckin(interaction: ButtonInteraction) {
   
}   