import { Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption, TextInputBuilder, TextInputStyle, ModalBuilder, RestOrArray, ActionRowBuilder, ModalSubmitInteraction, Interaction, MessageFlags, Message, SendableChannels, Embed, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, MessagePayload, SlashCommandBooleanOption, ButtonInteraction, GuildMember, Role, InteractionCollector, InteractionEditReplyOptions, SlashCommandUserOption, Channel, underline, Emoji, EmbedField, bold, AutocompleteInteraction, ApplicationCommandChoicesData, ApplicationCommandOptionWithAutocompleteMixin, SlashCommandIntegerOption, CategoryChannel, ChannelType } from "discord.js";
import { Tournament, TournamentManager } from "../../tournament_manager/tournaments.js";
import { Application } from "../../application.js";
import { log } from "console";
import { BotDefaults, Globals } from "../../globals.js";
import moment from "moment-timezone";
import { replyEphemeral, standardDiscordTimeFormat } from "../../utils.js";
import { ObjectId } from "mongodb";
import { BotDefaultsSchema, FriendCodesDbDefaults } from "../../database/models/defaults.js";
import { assertCond, AssertError } from "../../assert.js";
import { BotEmojis, EmojisManager } from "../../emoijs_manager.js";
import { randomUUID } from "crypto";
import { Iscriviti, IscrivitiBtn } from "./iscriviti.js";
import { UnsubscribeBtn } from "./unsubscribe.js";

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

export async function createTournamentMessage(tournament: Tournament) {
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

    const disiscrivitiBtn = new UnsubscribeBtn(tournament._id!.toString()).createButton();

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