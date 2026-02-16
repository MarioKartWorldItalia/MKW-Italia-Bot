import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, EmbedBuilder, MessageFlags } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { Rank } from "../../player_details/MMRManager";
import { Globals } from "../../globals";

export class GetMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("getmmr")
            .setDescription("Mostra l'MMR di Mario Kart Central")
            .addUserOption(option =>
                option.setName("player")
                    .setDescription("Il giocatore di cui vuoi vedere l'MMR")
                    .setRequired(false)
            )
            .toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        if(!options.interaction.isChatInputCommand() && !options.interaction.isModalSubmit()) {
            throw new Error("Invalid interaction type");
        }

        let playersManager = Application.getInstance().getPlayersManager();
        const user = options.getUserOption("player") || options.getInteractionUser();
        const player = await playersManager.getPlayer(user.id);

        if (player && player.getMMR()) {
            const MMR = player.getMMR()!;
            const link = await player.getMMR()!.getMMRLink();
            const embed = new EmbedBuilder()
            .setDescription(`l'MMR di **${user}** è ${MMR.getMMRValue()}.\nRank: ${Rank[MMR.rank]}\n[MKC Link](${link})`)
            .setColor(Globals.STANDARD_HEX_COLOR);

            await options.interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }
        else {
            await replyEphemeral(options.interaction, "Non hai ancora inserito il tuo MMR. Usa il comando /set_mmr per inserirlo!");
        }
    }
}