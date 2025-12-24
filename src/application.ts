import { assertCond } from "./assert.js"
import { APIEmbedField, ApplicationEmoji, Client, EmbedBuilder, Events, Guild, GuildEmoji, SlashCommandBuilder, TextChannel } from "discord.js";
import { log, logError } from "./log.js";
import { Globals } from "./globals.js";
import { TournamentManager } from "./tournament_manager/tournaments.js";
import { bindCommands } from "./interaction/slash_commands.js";
import "process"
import { abort, exit } from "process";
import { Database } from "./database/database.js";
import express from "express"
import { Server } from "http";
import { Collection } from "mongoose";
import { FeatureFlagsManager } from "./feature_flags/feature_flags_manager.js";
import { onWebhooks } from "./meta_webhooks.js";

export class Application {
    private static instance: Application;
    private tournamentManager!: TournamentManager;
    private client: Client;
    private webServer!: Server;
    private db: Database;
    private featureFlagsManager: FeatureFlagsManager;


    public constructor() {
        this.client = new Client({ intents: Globals.DEFAULT_INTENTS, ws: {large_threshold: 250} });
        this.db = new Database(undefined);
        this.featureFlagsManager = new FeatureFlagsManager();
    }

    public async getMainGuild(): Promise<Guild> {
        return this.client.guilds.fetch(Globals.MAIN_GUILD);
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

    public getDb(): Database {
        return this.db;
    }

    public async start() {
        let startFunctions: Array<Promise<void>> = [];

        startFunctions.push(this.db.init());
        startFunctions.push(this.featureFlagsManager.waitForInitialization());

        this.client.once(Events.ClientReady, async (client) => await this.onReady(client));
        //the client is not supposed to join guilds
        this.client.on(Events.GuildCreate, () => exit(1));

        this.client.on(Events.Warn, log);
        this.client.on(Events.Error, logError);

        await Promise.all(startFunctions);

        this.tournamentManager = new TournamentManager();
        
        await this.client.login(Globals.BOT_TOKEN);
        
        //initial fetch, then refresh every 35 secs to avoid rate limits
        await (await this.getMainGuild()).members.fetch({time: 60 * 1000}).catch(logError);
        
        setInterval(async () => {
            let guild = await (await Application.getInstance().getMainGuild()).fetch();
            if(!(guild.members.cache.size >= guild.memberCount)) {
                logError("Error checking members cache size: \nCache size: " + guild.members.cache.size + "\nMember count: " + guild.memberCount);
            }
        }, 15 * 60 * 1000);
        //comment out to updates the cache periodically
        //setInterval(async ()=>{(await Application.getInstance().getMainGuild()).members.fetch({time: 60 * 1000}).catch(logError)}, 300*1000);
        

        //TODO: TEMPORANEO
        //IN ORDINE: SCEGLI_FAZIONE
        // const CHANNEL_IDS = ["1412775711105875968"];
        // const MSG_IDS: string[] = ["1416807683285061633"];
        // const fetchChannels = await (await this.getMainGuild()).channels.fetch();
        // const channels = CHANNEL_IDS.map((c) => fetchChannels.find((c1) => c1!.id == c));
        // const roles = await (await this.getMainGuild()).roles.fetch();
        // const confirmedRole = roles.find((val) => val.id == "1409561282755166218");

        // const cymRoles = roles.filter((val) => {
        //     return val.id == "1402793516500783124"
        //         || val.id == "1402793599661506590"
        //         || val.id == "1402793806558134323"
        //         || val.id == "1402793755211464786"
        //         || val.name == "Jolly";
        // }
        // );
        // //log("LENGTH: " + cymRoles.size);
        // const guildEmojis = await (await this.getMainGuild()).emojis.fetch();
        // const botEmojis = await this.client.application?.emojis.fetch();
        // const bulletMk = guildEmojis.find((e) => e.name == "bulletmk");
        // const cross = botEmojis?.find((e)=>e.name == "cross");
        // const check = botEmojis?.find((e)=>e.name=="check");

        // await this.client.application?.emojis.fetch();
        // const emojis = this.client.application?.emojis.cache;
        // let roleToEmoji = new Map<String, ApplicationEmoji | undefined>();
        // roleToEmoji.set("1402793516500783124", emojis!.find((val) => val.id == "1412791661737803907"));
        // roleToEmoji.set("1402793599661506590", emojis!.find((val) => val.id == "1412791639017128007"));
        // roleToEmoji.set("1402793806558134323", emojis!.find((val) => val.id == "1412791619320676414"));
        // roleToEmoji.set("1402793755211464786", emojis!.find((val) => val.id == "1412791676229128355"));

        // async function refreshChooseYourMemeMsg() {
        //     let castChannels!: Array<TextChannel>;

        //     castChannels = channels.map((c) => c as TextChannel);
        //     if (true) {
        //         let msgs = [];
        //         for (let i = 0; i < castChannels.length; i++) {
        //             msgs.push(await castChannels[i].messages.fetch(MSG_IDS[i]));
        //         }

        //         let rolesMembers = new Map<String, String>();

        //         for (const _role of cymRoles) {
        //             const role = _role[1];
        //             let msg = "";

        //             const members = role.members;
        //             const confirmedMembers = confirmedRole?.members.filter((m) => members.find((m1) => m1.id == m.id) != undefined);
        //             let unconfirmedMembers = undefined;
        //             if (confirmedMembers != undefined) {
        //                 unconfirmedMembers = members.difference(confirmedMembers);
        //             }

        //             if (confirmedMembers && confirmedMembers.size != 0) {
        //                 let trail = "";
        //                 msg += `> ${check} Confermati (${confirmedMembers.size}): `
        //                 for (const m of confirmedMembers) {
        //                     msg += trail;
        //                     msg += `<@${m[1].id}>`;
        //                     trail = ", "
        //                 }
        //                 msg+="\n";
        //             }

        //             if (unconfirmedMembers && unconfirmedMembers.size != 0) {
        //                 let trail = "";
        //                 msg += `> ${cross} Non confermati (${unconfirmedMembers.size}): `
        //                 for (const m of unconfirmedMembers) {
        //                     msg += trail;
        //                     msg += `<@${m[1].id}>`;
        //                     trail = ", "
        //                 }
        //             }
        //             if(roleToEmoji.get(role.id) != undefined)
        //                 rolesMembers.set(`${bulletMk} ${roleToEmoji.get(role.id)} **${role.name}** (${role.members.size})`, msg);
        //             else
        //                 rolesMembers.set(`${bulletMk} **${role.name}** (${role.members.size})`, msg);
        //         }

        //         let finalMsg = "";
        //         let trail = "";
        //         finalMsg += "## TABELLA LIVE ISCRIZIONI\n\u200b\n";
        //         for (const entry of rolesMembers) {
        //             finalMsg += trail;
        //             finalMsg += entry[0] + "\n";
        //             finalMsg += entry[1];
        //             trail = "\n\n";
        //         }

        //         const embed = new EmbedBuilder()
        //         .setColor(Globals.STANDARD_HEX_COLOR)
        //         .setDescription(finalMsg)
        //         .toJSON();

        //         for (const msg of msgs) {
        //             if (!msg) {
        //                 return;
        //             }
        //             await msg.edit({
        //                 content: null,
        //                 embeds: [embed]
        //             })
        //         }
        //     }

        //     else {
        //         for (const ch of castChannels) { await ch.send({ content: "." }); }
        //     }
        // }
        // refreshChooseYourMemeMsg();
        // this.client.on("guildMemberUpdate", refreshChooseYourMemeMsg);



        //TODO END


        let server = express();
        server.get("/", (req, res) => { res.send("MKW Italia Bot is running") });
        server.get("/ping", (req, res) => { res.send("pong") });
        server.all("/webhooks", onWebhooks);
        this.webServer = server.listen(process.env.PORT, () => { log("Webserver started on port: " + process.env.PORT); });
    }


    private async onReady(client: Client) {
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

        await bindCommands(this.client);
        log("Aggiornamento comandi in corso...");

    }

    public async shutdown() {
        log("Starting application shutdown...");
        await this.client.destroy();
        log("Discord client correctly closed");
        await this.db.close();
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