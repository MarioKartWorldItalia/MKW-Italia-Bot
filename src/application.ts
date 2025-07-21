import { assertCond } from "./logging/assert.js"
import { Client, Events, SlashCommandBuilder } from "discord.js";
import { log } from "./logging/log.js";
import { Globals } from "./globals.js";
import { TournamentManager } from "./tournaments.js";
import { bindCommands } from "./interaction/slash_commands.js";
import "process"
import { abort, exit } from "process";
import { Database } from "./database.js";
import express from "express"
import { Server } from "http";

export class Application {
    private static instance: Application;
    private tournamentManager: TournamentManager;
    private client: Client;
    private webServer: Server;
    private db: Database;


    public constructor() {
        let server = express();
        server.get("/ping", (req, res) => { res.send("pong") });
        this.webServer = server.listen(process.env.PORT, () => { log("Webserver started on port: " + process.env.PORT); });


        this.client = new Client({ intents: Globals.DEFAULT_INTENTS });
        this.tournamentManager = new TournamentManager();

        this.db = new Database(undefined);
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

    public getClient(): Client {
        return this.client;
    }

    public start() {
        this.client.once(Events.ClientReady, (client) => this.onReady(client));
        //the client is not supposed to join guilds
        this.client.on(Events.GuildCreate, () => exit(1));
        this.client.login(Globals.BOT_TOKEN);
    }


    private onReady(client: Client) {
        log(`Logged in as ${client.user?.tag}`);
        log(`Version ${Globals.VERSION}`);
        log(
            `Currently into: ${client.guilds.cache.map((guild) => `${guild.name} (${guild.id})`).join(", ")}`
        );

        if (client.guilds.cache.size > Globals.MAX_SERVERS) {
            log(`Non possono esserci più di ${Globals.MAX_SERVERS} connessi in contemporanea`);
            abort();
        }

        if (client.guilds.cache.size > 0
            && client.guilds.cache.at(0)?.id != Globals.MAIN_GUILD
        ) {
            log("Il client non può essere connesso a server non autorizzati");
            abort();
        }


        bindCommands(this.client);
        log("Comandi aggiunti con successo");

    }

    public async shutdown() {
        log("Starting application shutdown...");
        await this.client.destroy();
        log("Discord client correctly closed");
        this.db.dispose();
        log("Database connection closed");
        this.webServer.close((err) => {
            if (err) {
                log(`Error closing web server: ${err.message}`);
                exit(1);
            }
            log("Web server closed successfully");
        });
    }
}