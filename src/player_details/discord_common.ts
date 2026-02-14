import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Application } from "../application";
import { BotDefaults, Globals } from "../globals";
import { Rank } from "./MMRManager";
import { PlayerEntry } from "./PlayerEntry";

export async function onMMRSet(player: PlayerEntry) {
    const defaults = await BotDefaults.getDefaults();
}

export async function createMMRTable() {
    const defaults = await BotDefaults.getDefaults();
    if (!defaults.MMRTableChannelId) {
        throw new Error("MMR Table channel id not set");
    }
    if (defaults.MMRTableMessageId) {
        return;
    }

    const buttons = createTableButtons();

    const channel = await (await Application.getInstance().getMainGuild()).channels.fetch(defaults.MMRTableChannelId);
    if (channel && channel.isTextBased()) {
        const msg = await channel.send(
            {
                content: "Caricamento tabella MMR...",
                components: [new ActionRowBuilder().addComponents(buttons).toJSON()]
            }
        );
        defaults.MMRTableMessageId = msg.id;
        await BotDefaults.setDefaults(defaults);
    }
    await updateMMRTable();
}

export async function updateMMRTable() {
    const defaults = await BotDefaults.getDefaults();
    if (!defaults.MMRTableChannelId) {
        throw new Error("MMR Table channel id not set");
    }

    const players = (await Application.getInstance().getPlayersManager().getAllPlayers())
        .filter(p => p.MMR)
        .sort((a, b) => b.MMR!.getMMRValue() - a.MMR!.getMMRValue());

    let msg = "# Tabella MMR\n";
    let counter = 1;
    for (const player of players) {
        const dsUser = (await Application.getInstance().getMainGuild()).members.cache.get(player.playerId.toString());
        if (!dsUser) {
            throw new Error(`User with id ${player.playerId} not found in guild`);
        }
        if (player.MMR) {
            msg += `\`${counter}\` **${dsUser.displayName}** - ${player.MMR.getMMRValue()} MMR (${Rank[player.MMR.rank]})\n`;
            counter++;
        }
    }
    msg += `\nUltimo aggiornamento: <t:${Math.floor(Date.now() / 1000)}:R>`
    const embed = new EmbedBuilder()
        .setDescription(msg)
        .setColor(Globals.STANDARD_HEX_COLOR);

    const channel = await (await Application.getInstance().getMainGuild()).channels.fetch(defaults.MMRTableChannelId);
    if (channel && channel.isTextBased()) {
        if (defaults.MMRTableMessageId) {
            const message = await channel.messages.fetch(defaults.MMRTableMessageId);
            if (message) {
                await message.edit({ content: null, embeds: [embed] });

            }
            else {
                throw new Error("MMR Table message not found");
            }
        }
    }
}

export async function onRankChange(player: PlayerEntry, oldRank: Rank, newRank: Rank) {
    const defaults = await BotDefaults.getDefaults();
}

export function createTableButtons() {
    const addButton = new ButtonBuilder()
        .setCustomId("add_mmr_button")
        .setLabel("Aggiungi MMR")
        .setStyle(ButtonStyle.Primary);

    const getButton = new ButtonBuilder()
        .setCustomId("get_mmr_button")
        .setLabel("Cerca MMR")
        .setStyle(ButtonStyle.Secondary);

    const removeButton = new ButtonBuilder()
        .setCustomId("remove_mmr_button")
        .setLabel("Rimuovi MMR")
        .setStyle(ButtonStyle.Danger);
    return [addButton, getButton, removeButton];
    
}