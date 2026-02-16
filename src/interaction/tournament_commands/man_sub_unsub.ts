import { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete } from "./common";
import { replyEphemeral } from "../../utils";
import { Iscriviti } from "./iscriviti";
import { Application } from "../../application";
import { Unsubscribe } from "./unsubscribe";
import { log } from "../../log";

const USER_OPTION = "player_id";

export class ManSubscribeEvent extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        let _builder = new SlashCommandBuilder()
            .setName("admin_aggiungi_giocatore")
            .setDescription("Aggiungi un giocatore ad un torneo")
            .addUserOption(option => option
                .setName(USER_OPTION)
                .setDescription("Giocatore da aggiungere")
                .setRequired(true))
                .addStringOption(option => option
                    .setName("evento")
                    .setDescription("ID del torneo")
                    .setAutocomplete(true)
                    .setRequired(true))
            .toJSON();
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

export class ManUnsubEvent extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        let _builder = new SlashCommandBuilder()
            .setName("admin_rimuovi_giocatore")
            .setDescription("Rimuovi un giocatore da un torneo")
            .addUserOption(option => option
                .setName(USER_OPTION)
                .setDescription("Giocatore da rimuovere")
                .setRequired(true))
            .addStringOption(option => option
                .setName("evento")
                .setDescription("ID del torneo")
                .setAutocomplete(true)
                .setRequired(true))
            .toJSON();
        return _builder;
    }

    public async exec(options: InteractionOptions): Promise<void> {
        if (options.interaction.isAutocomplete()) {
            checkAndPopulateAutocomplete(options.interaction);
            return;
        }
        if(!options.interaction.isChatInputCommand()) { 
            throw new TypeError();
        }
        const user = options.interaction.options.getUser(USER_OPTION);
        if (!user) {
            await replyEphemeral(options.interaction, "Giocatore non valido");
            return;
        }
        options.overrideOption("__user__", user);

        new Unsubscribe().exec(options);
    }
}