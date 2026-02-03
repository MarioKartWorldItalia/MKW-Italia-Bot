import { ApplicationIntegrationType, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ChatInputCommandInteraction, Client, Events, Interaction, InteractionCollector, MessageFlags, MessagePayload, ModalAssertions, ModalBuilder, ModalSubmitInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder, User } from "discord.js"
import { log, logError } from "../log";
import { assertCond } from "../assert";
import { bindFCCommands } from "./friend_codes_commands";
import { bindGeneralCommands } from "./util_commands";
import { StartCheckInCommand } from "./tournament_commands/start_checkin";
import { CheckInButton } from "./tournament_commands/checkin";
import { Iscriviti } from "./tournament_commands/iscriviti";
import { ConfermaIscrizione } from "./tournament_commands/conferma_iscrizione";
import { Unsubscribe } from "./tournament_commands/unsubscribe";
import { CommandsManager } from "./commands_manager";
import { CreateEvent } from "./tournament_commands/create_event";
import { MostraEvento } from "./tournament_commands/mostra_evento";
import { MostraPartecipanti } from "./tournament_commands/mostra_partecipanti";
import { AggiornaNomeEvento } from "./tournament_commands/aggiorna_nome_evento";
import { AggiornaDataEvento } from "./tournament_commands/aggiorna_data_evento";
import { RimuoviEvento, ConfermaRimozioneEvento } from "./tournament_commands/rimuovi_evento";
import { AdminAggiungiGiocatore } from "./tournament_commands/admin_aggiungi_giocatore";
import { AdminRimuoviGiocatore } from "./tournament_commands/admin_rimuovi_giocatore";

async function bindCommandsInner(client: Client, commandsManager: CommandsManager) {
    //TOURNAMENT COMMANDS
    commandsManager.addCommand(new StartCheckInCommand());
    commandsManager.addCommand(new CheckInButton());
    commandsManager.addCommand(new Iscriviti());
    commandsManager.addCommand(new ConfermaIscrizione());
    commandsManager.addCommand(new Unsubscribe());
    commandsManager.addCommand(new CreateEvent());
    commandsManager.addCommand(new MostraEvento());
    commandsManager.addCommand(new MostraPartecipanti());
    commandsManager.addCommand(new AggiornaNomeEvento());
    commandsManager.addCommand(new AggiornaDataEvento());
    commandsManager.addCommand(new RimuoviEvento());
    commandsManager.addCommand(new ConfermaRimozioneEvento());
    commandsManager.addCommand(new AdminAggiungiGiocatore());
    commandsManager.addCommand(new AdminRimuoviGiocatore());
}

export async function bindCommands(client: Client) {
    let commandsManager = new CommandsManager(client);

    bindCommandsInner(client, commandsManager).catch(e => logError(e));
}




    