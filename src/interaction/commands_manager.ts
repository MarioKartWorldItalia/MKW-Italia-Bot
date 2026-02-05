import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Client, Events, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { assertCond } from "../assert";
import { log, logError } from "../log";
import { CommandBase, InteractionOptions, SlashCommandBase } from "./interaction_base_classes";

export class CommandsManager {
    public constructor(client: Client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            let interactionName = "";
            let overrides: Map<string, any> = new Map();

            if (interaction instanceof AutocompleteInteraction) {
                interactionName = interaction.commandName;
            }

            if (interaction instanceof ChatInputCommandInteraction) {
                interactionName = interaction.commandName;
            }
            else if (interaction instanceof ModalSubmitInteraction || interaction instanceof ButtonInteraction) {
                let interactionFields = interaction.customId.split(" ");
                interactionName = interactionFields[0];
                for (let i = 1; i < interactionFields.length; i++) {
                    const field = interactionFields[i];
                    const separatorIndex = field.indexOf(":");
                    if (separatorIndex !== -1) {
                        const key = field.substring(0, separatorIndex);
                        const value = field.substring(separatorIndex + 1);
                        overrides.set(key, value);
                    }
                    else {
                        throw new Error("Bad interaction field format");
                    }
                }
            }
            assertCond(interactionName !== "", "Not a valid interaction name");
            const command = this.getCommand(interactionName);
            if (!command) {
                log("Comando non riconosciuto: " + interactionName);
                return;
            }

            let options = new InteractionOptions(interaction, overrides);
            options.overrideOption("__user__", interaction.user);

            try {
                await command.exec(options);
                log(`Comando eseguito: ${interactionName} [${interaction.constructor.name}]`);
            }
            catch (e) {
                let err = "Can't execute command " + interactionName + ": " + e;
                if (e instanceof Error) {
                    err = err + "\nStack trace:\n" + e.stack;
                }
                logError(err);
                try {
                    if (interaction.isRepliable() && !interaction.replied) {
                        await interaction.reply({
                            content: "Si è verificato un errore durante l'esecuzione del comando.",
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                } catch (e) {
                    //skip
                }
            }

        });
    }

    private commands: Map<string, CommandBase> = new Map();

    async registerCommands(client: Client) {
        const commandsArray = this.commands.values();
        for (const command of commandsArray) {
            if (command instanceof SlashCommandBase) {
                client.application!.commands.create(command.builder)
                    .then(() => log("Registered command: " + command.commandName));
            }
        }
    }

    public addCommand(command: CommandBase) {
        this.commands.set(command.commandName, command);
    }

    public getCommand(commandName: string): CommandBase | undefined {
        return this.commands.get(commandName);
    }

    public removeCommand(commandName: string) {
        this.commands.delete(commandName);
    }
}