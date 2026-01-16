import { ApplicationIntegrationType, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ChatInputCommandInteraction, Client, Events, Interaction, InteractionCollector, MessageFlags, MessagePayload, ModalAssertions, ModalBuilder, ModalSubmitInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder, User } from "discord.js"
import { bindTournamentCommands as bindTournamentCommands } from "./tournament_commands";
import { log, logError } from "../log";
import { assertCond } from "../assert";
import { bindFCCommands } from "./friend_codes_commands";
import { bindGeneralCommands } from "./util_commands";
import { StartCheckInCommand } from "./tournament_commands/start_checkin";
import { CheckInButton } from "./tournament_commands/checkin";
import { Iscriviti } from "./tournament_commands/iscriviti";
import { ConfermaIscrizione } from "./tournament_commands/conferma_iscrizione";

export class InteractionOptions {
    public interaction: Interaction;
    optionsOverride: Map<string, any> = new Map();

    public constructor(interaction: Interaction, optionsOverride?: Map<string, any>) {
        this.interaction = interaction;
        if (optionsOverride) {
            this.optionsOverride = optionsOverride;
        }
    }

    public overrideOption<T>(name: string, value: T) {
        this.optionsOverride.set(name, value);
    }

    public getInteractionUser(): User {
        if (this.optionsOverride.has("__user__")) {
            return this.optionsOverride.get("__user__") as User;
        }
        return this.interaction.user;
    }

    public getRequiredStringOption(name: string): string {
        return this.getOption<string>(name)!;
    }

    public getStringOption(name: string, required: boolean = false): string | undefined {
        return this.getOption<string>(name) as string | undefined;
    }

    public getRequiredOption<T>(name: string, required: true): T {
        return this.getOption<T>(name)!;
    }

    public getOption<T>(name: string): T | undefined {
        if (this.optionsOverride.has(name)) {
            return this.optionsOverride.get(name) as T;
        }
        else {
            if (this.interaction.isChatInputCommand()) {
                return this.interaction.options.get(name)?.value as T | undefined;
            }
            return undefined;
        }
    }
}

export abstract class CommandBase {
    public abstract get commandName(): string;
    public abstract exec(interaction: InteractionOptions): Promise<void>;

    public createCustomId(options?: Map<string, string>) {
        let commandName = this.commandName;
        let modalName = commandName;
        if (!options) {
            return modalName;
        }
        for (const option of options) {
            modalName += (" " + option[0] + ":" + option[1]);
        }
        return modalName;
    }
}

export abstract class SlashCommandBase extends CommandBase {
    abstract get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody;

    override get commandName(): string {
        return this.builder.name;
    }
}

export abstract class ButtonOrModalCommandBase extends CommandBase {
    public createCustomId(options?: Map<string, string>) {
        return ButtonOrModalCommandBase.s_CreateCustomId(this.commandName);
    }


}

class CommandsManager {
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

            const options = new InteractionOptions(interaction, overrides);
            try {
                await command.exec(options);
                log(`Comando eseguito: ${interactionName} [${typeof (interaction)}]`);
            }
            catch (e) {
                logError("Can't execute command " + interactionName + ": " + e);
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
                await client.application!.commands.create(command.builder);
                log("Registered command: " + command.commandName);
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


let handlersMap: Map<string, (interaction: Interaction) => Promise<void>> = new Map();

function mergeMaps<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
    for (const [key, value] of map2.entries()) {
        assertCond(value != undefined, `Handler non valido per l'API ${key}`);
        map1.set(key, value);
    }
    return map1;
}

async function bindCommandsInner(client: Client, commandsManager: CommandsManager) {
    //TOURNAMENT COMMANDS
    commandsManager.addCommand(new StartCheckInCommand());
    commandsManager.addCommand(new CheckInButton());
    commandsManager.addCommand(new Iscriviti());
    commandsManager.addCommand(new ConfermaIscrizione());



    mergeMaps(handlersMap, await bindGeneralCommands(client))
    mergeMaps(handlersMap, await bindTournamentCommands(client));
    mergeMaps(handlersMap, await bindFCCommands(client));
}

export async function bindCommands(client: Client) {
    bindCommandsInner(client).catch(e => logError(e));








    const handler: ((i: Interaction) => Promise<void>) | undefined = handlersMap.get(interactionName);

    if (handler === undefined) {
        if (interaction instanceof ChatInputCommandInteraction || interaction instanceof ModalSubmitInteraction) {
            // await interaction.reply({
            //     content: "Comando non riconosciuto",
            //     ephemeral: true
            // });
        }

        log(`Comando non riconosciuto: ${interactionName}`);
        return;
    }

    else {
        try {
            const result = handler(interaction);

            // Nulla di strano, controlla solo se la funzione è async 💀
            if (typeof (result as any)?.then !== "function") {
                throw new TypeError(`Handler per ${interactionName} non restituisce una Promise`);
            }

            await result;
            log(`Comando eseguito: ${interactionName} [${interaction.constructor.name}]`);
        } catch (e) {
            let err = `Errore durante l'esecuzione di ${interactionName}: ${e}`;
            if (e instanceof Error) {
                err += `\nStack trace:\n${e.stack}`;
            }
            logError(err);
            try {
                if (interaction.isRepliable() && !interaction.replied) {
                    await interaction.reply({
                        content: "Si è verificato un errore durante l'esecuzione del comando.",
                        ephemeral: true,
                    });
                }
            } catch (e) {
                //skip
            }
        }
    }
});
}