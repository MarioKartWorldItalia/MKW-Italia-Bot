import { RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { dBRemoveFriendCode, FriendCodeResult } from "../../frend_codes";
import { replyEphemeral } from "../../utils";
import { refreshFriendCodesMessage } from "./shared";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class DelFc extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("delfc")
            .setDescription("Rimuove il tuo codice amico dalla lista");
    }

    override async exec(options: InteractionOptions): Promise<void> {
        const interaction = options.interaction;
        
        if (!interaction.isChatInputCommand() && !interaction.isButton()) {
            throw new Error();
        }

        let rm = await dBRemoveFriendCode(interaction.user);
        if (rm == FriendCodeResult.NOT_PRESENT) {
            await replyEphemeral(interaction, "Non hai un codice amico registrato");
            return;
        }
        else if (rm == FriendCodeResult.OK) {
            await replyEphemeral(interaction, "Il tuo codice amico è stato rimosso correttamente");
        }
        await refreshFriendCodesMessage();
    }
}
