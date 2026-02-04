import { Client, Interaction } from "discord.js";
import { log } from "../log";

// Re-export classes from individual command files
export { SetFc } from "./friend_codes_commands/setfc";
export { DelFc } from "./friend_codes_commands/delfc";
export { GetFc } from "./friend_codes_commands/getfc";
export { ManSetFc } from "./friend_codes_commands/mansetfc";
export { ManDelFc } from "./friend_codes_commands/mandelfc";
export { ListaFc } from "./friend_codes_commands/listafc";
export { SearchFc } from "./friend_codes_commands/searchfc";

// Re-export shared utilities
export { refreshFriendCodesMessage, createFriendCodesMessageEmbed, createFriendCodesButtons } from "./friend_codes_commands/shared";

export async function bindFCCommands(client: Client): Promise<Map<String, (i: Interaction) => Promise<void>>> {
    // Commands are now registered through CommandsManager
    log("Comandi codici amico aggiornati");
    return new Map<String, (i: Interaction) => Promise<void>>;
}