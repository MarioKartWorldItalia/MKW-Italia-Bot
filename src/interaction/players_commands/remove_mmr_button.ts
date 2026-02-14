import { CommandBase, InteractionOptions } from "../interaction_base_classes";
import { RemoveMMR } from "./rm_mmr";

export class RemoveMMRButton extends CommandBase {
    public get commandName(): string {
        return "remove_mmr_button";
    }
    public async exec(options: InteractionOptions): Promise<void> {
        if(!options.interaction.isButton()) {
            throw new Error("Invalid interaction type");
        }
        new RemoveMMR().guardedExec(options);
    }
}