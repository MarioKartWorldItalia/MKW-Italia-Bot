import { LabelBuilder, ModalBuilder, UserSelectMenuBuilder } from "discord.js";
import { InteractionOptions } from "../interaction_base_classes";

export class GetMMRButton {
    public get commandName(): string {
        return "get_mmr_button";
    }
    public async exec(options: InteractionOptions): Promise<void> {
        if(!options.interaction.isButton()) {
            throw new Error("Invalid interaction type");
        }
        
        let modal = new ModalBuilder().setCustomId("get_mmr_modal").setTitle("Aggiungi MMR");
        const mmrLink = new LabelBuilder()
            .setLabel("Utente")
            .setUserSelectMenuComponent(
                new UserSelectMenuBuilder()
                    .setCustomId("user")
                    .setPlaceholder("Utente di cui vuoi vedere l'MMR")
                    .setRequired(true)
            );
        modal.addLabelComponents(mmrLink);
        await options.interaction.showModal(modal);
    }
}