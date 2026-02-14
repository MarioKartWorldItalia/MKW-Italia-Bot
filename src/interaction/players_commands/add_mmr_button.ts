import { LabelBuilder, ModalBuilder, TextDisplayBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CommandBase, InteractionOptions } from "../interaction_base_classes";
import { ActionRowBuilder } from "@discordjs/builders";
import { SetMMR } from "./set_mmr";
import { replyEphemeral } from "../../utils";
import { response } from "express";
import { log } from "../../log";

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


        let response = await options.interaction.awaitModalSubmit({ time: 60000 * 15 }).catch(log);
        if (!response) {
            await replyEphemeral(options.interaction, "Tempo scaduto per inserire il link MKC. Riprova.");
            return;
        }
        const mkcLink = response.fields.getTextInputValue("mkc_link");
        new SetMMR().guardedExec(new InteractionOptions(response, options.optionsOverride.set("mkc_link", mkcLink)));

    }

}

