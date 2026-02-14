import { LabelBuilder, ModalBuilder, UserSelectMenuBuilder } from "discord.js";
import { CommandBase, InteractionOptions } from "../interaction_base_classes";
import { log } from "../../log";
import { replyEphemeral } from "../../utils";
import { GetMMR } from "./get_mmr";

export class GetMMRButton extends CommandBase{
    public get commandName(): string {
        return "get_mmr_button";
    }
    public async exec(options: InteractionOptions): Promise<void> {
        if(!options.interaction.isButton()) {
            throw new Error("Invalid interaction type");
        }
        
        let modal = new ModalBuilder().setCustomId("get_mmr_modal").setTitle("Cerca MMR");
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

        let response = await options.interaction.awaitModalSubmit({ time: 60000 * 15 }).catch(log);
        if(!response) {
            await replyEphemeral(options.interaction, "Tempo scaduto per selezionare l'utente. Riprova.")
            return;
        }
        const user = response.fields.getSelectedUsers("user")?.first();
        if(!user) {
            await replyEphemeral(options.interaction, "Non hai selezionato un utente valido. Riprova.");
            return;
        }
        new GetMMR().guardedExec(new InteractionOptions(response, options.optionsOverride.set("player", user)));
    }
}