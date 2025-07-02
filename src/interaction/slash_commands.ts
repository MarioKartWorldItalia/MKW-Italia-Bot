import { ChatInputCommandInteraction, Client, Events, ModalAssertions } from "discord.js"
import { bindTournamentCommands as bindTournamentCommands } from "./tournament_commands";
import { Globals } from "../globals";
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
        if (!interaction.isCommand()) {
            return;
        }

        const castInteraction = interaction as ChatInputCommandInteraction;
        const handler = handlersMap.get(castInteraction.commandName);
        if (!handler) {
            interaction.reply("Comando non riconosciuto o non implementato");
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
                interaction.reply("Si è verificato un errore durante l'esecuzione del comando.");
            }
        }
    });
} 