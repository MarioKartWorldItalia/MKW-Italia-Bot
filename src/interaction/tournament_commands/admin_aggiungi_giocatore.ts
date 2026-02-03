import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandUserOption, ChatInputCommandInteraction } from "discord.js";
import { checkAndPopulateAutocomplete } from "../tournament_commands.js";
import { replyEphemeral } from "../../utils.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes.js";
import { Iscriviti } from "./iscriviti.js";

export class AdminAggiungiGiocatore extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        let _builder = new SlashCommandBuilder()
            .setName("admin_aggiungi_giocatore")
            .setDescription("Aggiungi un giocatore ad un evento");

        let userOption = new SlashCommandUserOption()
            .setName("player_id")
            .setDescription("Il giocatore da aggiungere")
            .setRequired(true);

        _builder.addUserOption(userOption);
        return _builder;
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (await checkAndPopulateAutocomplete(options.interaction)) {
            return;
        }

        if (!(options.interaction instanceof ChatInputCommandInteraction)) {
            throw new Error();
        }
        const castInteraction = options.interaction as ChatInputCommandInteraction;

        const user = castInteraction.options.getUser("player_id");
        if (!user) {
            await replyEphemeral(options.interaction, "Giocatore non valido");
            return;
        }

        const newOptions = new InteractionOptions(options.interaction);
        newOptions.overrideOption("__user__", user);
        
        await new Iscriviti().exec(newOptions);
    }
}
