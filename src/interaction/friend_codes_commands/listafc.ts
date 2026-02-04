import { RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { dbGetAllFriendCodes } from "../../frend_codes";
import { replyEphemeral } from "../../utils";
import { Application } from "../../application";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class ListaFc extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("listafc")
            .setDescription("Ottiene la lista di tutti i codici amico registrati");
    }

    override async exec(options: InteractionOptions): Promise<void> {
        const interaction = options.interaction;
        
        if (!interaction.isChatInputCommand()) {
            return;
        }
        
        const guild = await Application.getInstance().getMainGuild();
        let friendCodes = await dbGetAllFriendCodes();

        if (friendCodes.size == 0) {
            await replyEphemeral(interaction, "Nessun codice amico registrato");
            return;
        }

        let reply = "Lista codici amico:\n";
        friendCodes.forEach((value, key) => {
            if(!guild.members.cache.get(key))
                return;
            reply = reply.concat(`<@${key}>: ${value.toString()}\n`);
        });
        await replyEphemeral(interaction, reply);
    }
}
