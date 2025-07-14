import { ButtonInteraction, ChatInputCommandInteraction, Client, Events, Interaction, InteractionCollector, ModalAssertions, ModalSubmitInteraction } from "discord.js"
import { bindTournamentCommands as bindTournamentCommands } from "./tournament_commands";
import { log } from "../logging/log";

let handlersMap: Map<string, (interaction: Interaction) => Promise<void>> = new Map();

function mergeMaps<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
    for (const [key, value] of map2.entries()) {
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

        if (!handler) {
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
            handler(interaction)
                .then((v) => log(`Comando eseguito: ${interactionName}`))
                .catch((e) => {
                    if (interaction instanceof ChatInputCommandInteraction || interaction instanceof ModalSubmitInteraction) {
                        log(`Errore nell'esecuzione del comando ${interactionName}: ${e instanceof Error ? e.message : e} \n Stack trace:\n ${e instanceof Error && e.stack ? e.stack : "N/A"}`);
                        interaction.reply(
                            {
                                content: "Si è verificato un errore durante l'esecuzione del comando.",
                                ephemeral: true
                            }
                        );
                    }
                });
        }
    });
}