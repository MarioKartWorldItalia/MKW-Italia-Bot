import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, SlashCommandUserOption, ChatInputCommandInteraction } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "../tournament_commands";

const TOURNAMENT_ID_OPTION = "evento";
const USER_OPTION = "player_id";

export class AdminRimuoviGiocatore extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("admin_rimuovi_giocatore")
            .setDescription("Rimuovi un giocatore da un evento (solo admin)")
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
                    .setDescription("Utente da rimuovere")
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

        const originalUser = options.interaction.user;
        Object.defineProperty(options.interaction, 'user', { value: user, configurable: true, writable: true });
        //  await onDisiscriviti(interaction as ChatInputCommandInteraction);
        throw new Error("uncomment the line above");
        Object.defineProperty(options.interaction, 'user', { value: originalUser, configurable: true, writable: true });
    }
}
