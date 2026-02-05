import { LabelBuilder, ModalBuilder, TextDisplayBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CommandBase, InteractionOptions } from "../interaction_base_classes";
import { ActionRowBuilder } from "@discordjs/builders";
import { SetMMR } from "./set_mmr";

export class AddMMRButton extends CommandBase {
    public get commandName(): string {
        return "add_mmr_button";
    }
    public async exec(options: InteractionOptions): Promise<void> {
        if (!options.interaction.isButton()) {
            throw new Error("Invalid interaction type");
        }

        let modal = new ModalBuilder().setCustomId("add_mmr_modal").setTitle("Aggiungi MMR");
        const mmrLink = new LabelBuilder()
            .setLabel("Link MKC")
            .setTextInputComponent(
                new TextInputBuilder()
                    .setCustomId("mkc_link")
                    .setPlaceholder("Inserisci il link al tuo profilo MKC")
                    .setRequired(true)
                    .setStyle(TextInputStyle.Paragraph)
            );
        modal.addLabelComponents(mmrLink);
        await options.interaction.showModal(modal);

        const response = await options.interaction.awaitModalSubmit({ time: 60000 * 15 });
        const mkcLink = response.fields.getTextInputValue("mkc_link");
        new SetMMR().exec(new InteractionOptions(response, options.optionsOverride.set("mkc_link", mkcLink)));

    }


}