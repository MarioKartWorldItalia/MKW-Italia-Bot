import { RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { dBRemoveFriendCode, FriendCodeResult } from "../../frend_codes";
import { replyEphemeral } from "../../utils";
import { refreshFriendCodesMessage } from "./shared";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class ManDelFc extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("mandelfc")
            .setDescription("Rimuove il codice amico di una persona")
            .addUserOption(option => {
                return option.setName("user_id")
                    .setDescription("ID Discord della persona di cui rimuovere il codice amico")
                    .setRequired(true);
            })
            .toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        const interaction = options.interaction;
        
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const user = interaction.options.getUser("user_id", true);

        let rm = await dBRemoveFriendCode(user);
        if (rm == FriendCodeResult.NOT_PRESENT) {
            await replyEphemeral(interaction, `${user.tag} non ha un codice amico registrato`);
            return;
        }
        else if (rm == FriendCodeResult.OK) {
            await replyEphemeral(interaction, `Il codice amico di ${user.tag} è stato rimosso correttamente`);
        }
        await refreshFriendCodesMessage();
    }
}
