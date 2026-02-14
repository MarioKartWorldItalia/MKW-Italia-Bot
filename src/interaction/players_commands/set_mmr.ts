import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, Options, EmbedBuilder, MessageFlags } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { Application } from "../../application";
import { MMR, Rank } from "../../player_details/MMRManager";
import { replyEphemeral } from "../../utils";
import { Globals } from "../../globals";
import { log } from "../../log";

export class SetMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("setmmr")
            .setDescription("Inserisce l'MMR del profilo lounge di Mario Kart Central")
            .addStringOption(option =>
                option.setName("mkc_link")
                    .setDescription("Link al profilo di Mario Kart Central")
                    .setRequired(true)
            ).toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        const playersManager = Application.getInstance().getPlayersManager();
        const mkcLink = options.getRequiredStringOption("mkc_link");

        try {
            const playerId = MMR.getPlayerIdFromUrl(mkcLink);
            const mmr = await MMR.getHighestMMR(playerId);


            let player = await playersManager.getOrCreatePlayer(options.getInteractionUser().id);
            player.setMMR(mmr);
            await playersManager.updateOrCreatePlayer(player);
            const embed = new EmbedBuilder()
                .setTitle("MMR aggiornato")
                .setDescription(`Il tuo MMR è stato aggiornato a ${mmr.getMMRValue()}.\n Link: ${mkcLink}\n In caso avessi falsificato (volontariamente o non) il tuo mmr uno staff si appresterà a correggerlo`)
                .setColor(Globals.STANDARD_HEX_COLOR);
            if (options.interaction.isRepliable()) {
                options.interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                })
            }
        }
        catch (e) {
            await replyEphemeral(options.interaction, "Link MKC non valido. Assicurati di inserire un link al tuo profilo MKC.");
            return;
        }

    }
}