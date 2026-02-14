import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { SetMMR } from "./set_mmr";

export class ManSetMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("mansetmmr")
            .setDescription("Inserisce l'MMR del profilo lounge di Mario Kart Central")
            .addStringOption(option =>
                option.setName("mkc_link")
                    .setDescription("Link al profilo Lounge di Mario Kart Central")
                    .setRequired(true)
            ).toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        await new SetMMR().guardedExec(options);
    }
}