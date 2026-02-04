import { inlineCode, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { dBGetFriendCode } from "../../frend_codes";
import { replyEphemeral } from "../../utils";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class GetFc extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("getfc")
            .setDescription("Ottieni il codice amico di un utente")
            .addUserOption(option => {
                return option.setName("user_id")
                    .setDescription("ID della persona di cui ottenere il codice amico")
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
        const fc = await dBGetFriendCode(user);
        if (!fc) {
            await replyEphemeral(interaction, `<@${user.id}> non ha un codice amico registrato`);
            return;
        }
        await replyEphemeral(interaction, `Il codice amico di <@${user.id}> è: ${inlineCode(fc.toString())}`);
    }
}
