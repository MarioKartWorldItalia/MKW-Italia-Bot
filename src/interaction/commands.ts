import { Client } from "discord.js"
import { logError } from "../log";
import { StartCheckInCommand } from "./tournament_commands/start_checkin";
import { CheckInButton } from "./tournament_commands/checkin";
import { Iscriviti } from "./tournament_commands/iscriviti";
import { ConfermaIscrizione } from "./tournament_commands/conferma_iscrizione";
import { Unsubscribe } from "./tournament_commands/unsubscribe";
import { CommandsManager } from "./commands_manager";
import { CreateEvent } from "./tournament_commands/create_event";
import { AggiornaNomeTorneo } from "./tournament_commands/aggiorna_nome";
import { RimuoviEvento } from "./tournament_commands/rimuovi_evento";
import { ConfermaRimozioneTorneo } from "./tournament_commands/conferma_rimozione";
import { ManSubscribeEvent as ManSubscribeEvent, ManUbsubEvent } from "./tournament_commands/man_sub_unsub";
// Friend code commands
import { SetFc } from "./friend_codes_commands/setfc";
import { DelFc } from "./friend_codes_commands/delfc";
import { GetFc } from "./friend_codes_commands/getfc";
import { ManSetFc } from "./friend_codes_commands/mansetfc";
import { ManDelFc } from "./friend_codes_commands/mandelfc";
import { ListaFc } from "./friend_codes_commands/listafc";
import { SearchFc } from "./friend_codes_commands/searchfc";

async function bindCommandsInner(client: Client, commandsManager: CommandsManager) {
    //TOURNAMENT COMMANDS
    commandsManager.addCommand(new StartCheckInCommand());
    commandsManager.addCommand(new CheckInButton());
    commandsManager.addCommand(new Iscriviti());
    commandsManager.addCommand(new ConfermaIscrizione());
    commandsManager.addCommand(new Unsubscribe());
    commandsManager.addCommand(new CreateEvent());
    commandsManager.addCommand(new AggiornaNomeTorneo());
    commandsManager.addCommand(new RimuoviEvento());
    commandsManager.addCommand(new ConfermaRimozioneTorneo());
    commandsManager.addCommand(new ManSubscribeEvent())
    commandsManager.addCommand(new ManUbsubEvent())

    //FRIEND CODE COMMANDS
    commandsManager.addCommand(new SetFc());
    commandsManager.addCommand(new DelFc());
    commandsManager.addCommand(new GetFc());
    commandsManager.addCommand(new ManSetFc());
    commandsManager.addCommand(new ManDelFc());
    commandsManager.addCommand(new ListaFc());
    commandsManager.addCommand(new SearchFc());
}

export async function bindCommands(client: Client) {
    let commandsManager = new CommandsManager(client);

    bindCommandsInner(client, commandsManager).catch(e => logError(e));
}




    