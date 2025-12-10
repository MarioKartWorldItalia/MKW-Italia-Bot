import { ApplicationIntegrationType, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Client, Events, Interaction, InteractionCollector, ModalAssertions, ModalSubmitInteraction, SlashCommandBuilder } from "discord.js"
import { bindTournamentCommands as bindTournamentCommands } from "./tournament_commands";
import { log, logError } from "../log";
import { assertCond } from "../assert";
import { bindFCCommands } from "./friend_codes_commands";
import { bindGeneralCommands } from "./util_commands";

let handlersMap: Map<string, (interaction: Interaction) => Promise<void>> = new Map();

function mergeMaps<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
    for (const [key, value] of map2.entries()) {
        assertCond(value != undefined, `Handler non valido per l'API ${key}`);
        map1.set(key, value);
    }
    return map1;
}

async function bindCommandsInner(client: Client) {
    handlersMap.set("reset_commands", async (i) => {
        await client.application?.commands.set([]);
        process.emit("SIGTERM");
        return;
    });

    mergeMaps(handlersMap, await bindGeneralCommands(client))
    mergeMaps(handlersMap, await bindTournamentCommands(client));
    mergeMaps(handlersMap, await bindFCCommands(client));
}

export async function bindCommands(client: Client) {
    if (false) {
        await client.application?.commands.create(
            new SlashCommandBuilder()
                .setName("reset_commands")
                .setDescription("Resetta tutti i comandi")
        );
    }

    bindCommandsInner(client).catch(e => logError(e));
    client.on(Events.InteractionCreate, async (interaction) => {
        let interactionName = "";
        if (interaction instanceof AutocompleteInteraction) {
            interactionName = interaction.commandName;
        }

        if (interaction instanceof ChatInputCommandInteraction) {
            interactionName = interaction.commandName;
        }
        else if (interaction instanceof ModalSubmitInteraction || interaction instanceof ButtonInteraction) {
            interactionName = interaction.customId.split(" ")[0];
        }

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