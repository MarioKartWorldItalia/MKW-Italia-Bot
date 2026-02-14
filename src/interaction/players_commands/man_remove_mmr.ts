import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { RemoveMMR } from "./rm_mmr";

export class ManRemoveMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("manremovemmr")
            .setDescription("Rimuove l'MMR del profilo lounge di Mario Kart Central")
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("Utente di cui rimuovere l'MMR")
                    .setRequired(true)
            )
            .toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        options.overrideOption("__user__", options.getUserOption("user")!);
        await new RemoveMMR().guardedExec(options);
    }
}