import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, SlashCommandUserOption, ChatInputCommandInteraction } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { replyEphemeral } from "../../utils";

const TOURNAMENT_ID_OPTION = "evento";
const USER_OPTION = "player_id";

export class AdminAggiungiGiocatore extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("admin_aggiungi_giocatore")
            .setDescription("Aggiungi un giocatore ad un evento (solo admin)")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName(TOURNAMENT_ID_OPTION)
                    .setDescription("Seleziona un evento")
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .addUserOption(
                new SlashCommandUserOption()
                    .setName(USER_OPTION)
                    .setDescription("Utente da aggiungere")
                    .setRequired(true)
            )
            .toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (options.interaction.isAutocomplete()) {
            await checkAndPopulateAutocomplete(options.interaction);
            return;
        }

        if (!(options.interaction instanceof ChatInputCommandInteraction)) {
            throw new Error();
        }

        const user = options.interaction.options.getUser(USER_OPTION);
        if (!user) {
            await replyEphemeral(options.interaction, "Giocatore non valido");
            return;
        }

        // modifica la proprità user di interaction temporaneamente
        const originalUser = options.interaction.user;
        Object.defineProperty(options.interaction, 'user', { value: user, configurable: true, writable: true });

        //await onIscriviti(interaction);
        throw new Error("uncomment the line above");
        Object.defineProperty(options.interaction, 'user', { value: originalUser, configurable: true, writable: true });
    }
}
