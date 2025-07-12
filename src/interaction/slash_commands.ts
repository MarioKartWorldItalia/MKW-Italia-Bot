import { ChatInputCommandInteraction, Client, Events, InteractionCollector, ModalAssertions, ModalSubmitInteraction } from "discord.js"
import { bindTournamentCommands as bindTournamentCommands } from "./tournament_commands";
import { log } from "../logging/log";

let handlersMap: Map<string, (interaction: ChatInputCommandInteraction) => void> = new Map();

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

    client.on(Events.InteractionCreate, (interaction) => {
        if (interaction.isModalSubmit()) {
            const castInteraction = interaction as ModalSubmitInteraction;
            castInteraction.reply("Not implemented");
            return;
        }

        const castInteraction = interaction as ChatInputCommandInteraction;
        const handler = handlersMap.get(castInteraction.commandName);
        if (!handler) {
            castInteraction.reply("Comando non riconosciuto o non implementato");
            log(`Comando non riconosciuto: ${castInteraction.commandName}`);
            return;
        }

        else {
            try {
                handler(castInteraction);
                log(`Comando eseguito: ${castInteraction.commandName}`);
            }
            catch (e) {
                log(`Errore nell'esecuzione del comando ${castInteraction.commandName}: ${e}`);
                castInteraction.reply("Si è verificato un errore durante l'esecuzione del comando.");
            }
        }
    });
} 