import { RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { dBAddFriendCode, FriendCode, InvalidFriendCode } from "../../frend_codes";
import { replyEphemeral } from "../../utils";
import { refreshFriendCodesMessage } from "./shared";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class ManSetFc extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("mansetfc")
            .setDescription("Aggiunge il codice amico di una persona")
            .addUserOption(option => {
                return option.setName("user_id")
                    .setDescription("ID della persona a cui aggiungere il codice amico")
                    .setRequired(true);
            })
            .addStringOption(option => {
                return option.setName("codice")
                    .setDescription("Codice amico da aggiungere")
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
        const code = interaction.options.getString("codice", true);

        try {
            const fc = new FriendCode(code);
            await dBAddFriendCode(user, fc);
            await replyEphemeral(interaction, `Codice amico ${fc.toString()} aggiunto correttamente a ${user.tag}`);
        }
        catch (e) {
            if (e instanceof InvalidFriendCode) {
                await replyEphemeral(interaction, "Il codice amico inserito non è valido. Assicurati di averlo scritto correttamente come mostrato sulla console (es. SW-1234-5678-9012)");
                return;
            }
            throw e;
        }
        await refreshFriendCodesMessage();
    }
}
