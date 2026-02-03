import { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "../tournament_commands";
import { replyEphemeral } from "../../utils";
import { Iscriviti } from "./iscriviti";
import { Application } from "../../application";
import { Unsubscribe } from "./unsubscribe";

const USER_OPTION = "player_id";

export class ManSubscribeEvent extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        let _builder = new SlashCommandBuilder()
            .setName("admin_aggiungi_giocatore")
            .setDescription("Aggiungi un giocatore ad un torneo")
            .addUserOption(option => option
                .setName(USER_OPTION)
                .setDescription("Giocatore da aggiungere")
                .setRequired(true)).toJSON();
        return _builder;
    }

    public async exec(options: InteractionOptions): Promise<void> {
        let interaction = options.interaction;

        if (await checkAndPopulateAutocomplete(interaction)) {
            return;
        }

        if (!(interaction instanceof ChatInputCommandInteraction)) {
            throw new Error();
        }
        const castInteraction = interaction as ChatInputCommandInteraction;

        const user = castInteraction.options.getUser(USER_OPTION);
        if (!user) {
            await replyEphemeral(interaction, "Giocatore non valido");
            return;
        }
        options.overrideOption("__user__", user);
        new Iscriviti().exec(options);
    }
}

export class ManUbsubEvent extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        let _builder = new SlashCommandBuilder()
            .setName("admin_rimuovi_giocatore")
            .setDescription("Rimuovi un giocatore da un torneo")
            .addUserOption(option => option
                .setName(USER_OPTION)
                .setDescription("Giocatore da rimuovere")
                .setRequired(true)).toJSON();
        return _builder;
    }

    public async exec(options: InteractionOptions): Promise<void> {
       if(options.interaction.isAutocomplete()) {
        checkAndPopulateAutocomplete(options.interaction);
        return;
       }
       
        const user = (await Application.getInstance().getMainGuild()).members.fetch(
            options.getRequiredUserOption(USER_OPTION).id
        );
        options.overrideOption("__user__", user);

        new Unsubscribe().exec(options);
    }
}