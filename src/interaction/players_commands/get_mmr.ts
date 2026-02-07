import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";

export class GetMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("get_mmr")
            .setDescription("Mostra l'MMR di Mario Kart Central")
            .toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        let playersManager = Application.getInstance().getPlayersManager();
        const player = await playersManager.getPlayer(options.getInteractionUser().id);

        if (player && player.getMMREntry()) {
            const MMR = player.getMMREntry()!.getMMRValue();
            const link = await player.getMMREntry()!.getMMRLink();
            await replyEphemeral(options.interaction, `Il tuo MMR è ${MMR}. Link: ${link}`);
        }
        else {
            await replyEphemeral(options.interaction, "Non hai ancora inserito il tuo MMR. Usa il comando /set_mmr per inserirlo!");
        }
    }
}