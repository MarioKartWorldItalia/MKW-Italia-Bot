import { ButtonInteraction, ChatInputCommandInteraction, Client, Events, Interaction, InteractionCollector, ModalAssertions, ModalSubmitInteraction } from "discord.js"
import { bindTournamentCommands as bindTournamentCommands } from "./tournament_commands";
import { log } from "../logging/log";
import { assertCond } from "../logging/assert";

let handlersMap: Map<string, (interaction: Interaction) => Promise<void>> = new Map();

function mergeMaps<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
    for (const [key, value] of map2.entries()) {
        assertCond(value != undefined, `Handler non valido per l'API ${key}`);
        map1.set(key, value);
    }
    return map1;
}

function bindCommandsInner(client: Client) {
    let map = bindTournamentCommands(client);
    handlersMap = mergeMaps(handlersMap, map);
}

export function bindCommands(client: Client) {

    bindCommandsInner(client);

    client.on(Events.InteractionCreate, async (interaction) => {
        let interactionName = "";
        if (interaction instanceof ChatInputCommandInteraction) {
            interactionName = interaction.commandName;
        }
        else if (interaction instanceof ModalSubmitInteraction || interaction instanceof ButtonInteraction) {
            interactionName = interaction.customId.split(" ")[0];
        }

        const handler: ((i: Interaction) => Promise<void>) | undefined = handlersMap.get(interactionName);

        if (handler === undefined) {
            if (interaction instanceof ChatInputCommandInteraction || interaction instanceof ModalSubmitInteraction) {
                interaction.reply({
                    content: "Comando non riconosciuto",
                    ephemeral: true
                });
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
                log(`Comando eseguito: ${interactionName}`);
            } catch (e) {
                log(`Errore durante l'esecuzione di ${interactionName}: ${e}`);
                if(e instanceof Error) {
                    log("Stack trace: " + e.stack);
                }
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