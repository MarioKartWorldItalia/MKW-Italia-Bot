import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, Options } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { Application } from "../../application";
import { MMREntry } from "../../player_details/MMRManager";
import { replyEphemeral } from "../../utils";

export class SetMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("set_mmr")
            .setDescription("Inserisce l'MMR di Mario Kart Central")
            .addStringOption(option =>
                option.setName("mkc_link")
                    .setDescription("Link al profilo di Mario Kart Central")
                    .setRequired(true)
            ).toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        const playersManager = Application.getInstance().getPlayersManager();
        const mkcLink = options.getRequiredStringOption("mkc_link");
        
        const MMR = await MMREntry.getMMRFromLink(mkcLink);
        let player = await playersManager.getOrCreatePlayer(options.getInteractionUser().id);
        player.setMMREntry(MMR);
        await playersManager.updateOrCreatePlayer(player);
        await replyEphemeral(options.interaction, `MMR aggiornato correttamente! Il tuo MMR è ${MMR.getMMRValue()}. Link: ${await MMR.getMMRLink()}`);
    }
}