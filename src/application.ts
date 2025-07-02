import {assertCond} from "./logging/assert.js"
import { Client, Events, SlashCommandBuilder } from "discord.js";
import { log } from "./logging/log.js";
import { Globals } from "./globals.js";
import { TournamentManager } from "./tournaments.js";
import { bindCommands } from "./interaction/slash_commands.js";


export class Application {
    private static instance: Application | undefined;
    private tournamentManager: TournamentManager;
    readonly client: Client;


    public constructor() {
        this.client = new Client({ intents: Globals.DEFAULT_INTENTS });
        this.tournamentManager = new TournamentManager();
    }

    public getTournamentManager(): TournamentManager {
        return this.tournamentManager;
    }

    public static setInstance(instance: Application) {
        assertCond(!Application.instance, "instance già presente");
        Application.instance = instance;
    }

    public static getInstance(): Application {
        assertCond(Application.instance !== undefined, "instance non presente");
        return Application.instance as Application;
    }

    public start() {
        this.client.once(Events.ClientReady, (client) => this.onReady(client));
        this.client.login(Globals.BOT_TOKEN);
    }


    private onReady(client: Client) {
        log(`Logged in as ${client.user?.tag}`);
        log(`Version ${Globals.VERSION}`);
        log(
            `Currently into: ${client.guilds.cache.map((guild) => `${guild.name} (${guild.id})`).join(", ")}`
        );

        assertCond(
            client.guilds.cache.size <= 1
            && client.guilds.cache.has(Globals.MAIN_GUILD),
            "Il bot deve essere presente in un solo server, e quest'ultimo deve essere approvato."
        )

        Application.setInstance(this);
        bindCommands(this.client);
        log("Comandi aggiunti con successo");

    }
}
