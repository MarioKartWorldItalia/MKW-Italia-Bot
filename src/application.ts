import { assertCond } from "./assert.js"
import { ActionRowBuilder, APIEmbedField, ApplicationEmoji, ButtonBuilder, ButtonStyle, Channel, Client, EmbedBuilder, Events, Guild, GuildEmoji, GuildMemberRoleManager, inlineCode, InteractionResponse, Role, SlashCommandBuilder, TextChannel } from "discord.js";
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
import { replyEphemeral } from "./utils.js";

export class Application {
    private static instance: Application;
    private tournamentManager!: TournamentManager;
    private client: Client;
    private webServer!: Server;
    private db: Database;
    private featureFlagsManager: FeatureFlagsManager;


    public constructor() {
        this.client = new Client({ intents: Globals.DEFAULT_INTENTS, ws: { large_threshold: 250 } });
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
        await (await this.getMainGuild()).members.fetch({ time: 60 * 1000 }).catch(logError);

        setInterval(async () => {
            let guild = await (await Application.getInstance().getMainGuild()).fetch();
            if (!(guild.members.cache.size >= guild.memberCount)) {
                logError("Error checking members cache size: \nCache size: " + guild.members.cache.size + "\nMember count: " + guild.memberCount);
            }
        }, 15 * 60 * 1000);
        //comment out to updates the cache periodically
        //setInterval(async ()=>{(await Application.getInstance().getMainGuild()).members.fetch({time: 60 * 1000}).catch(logError)}, 300*1000);


        //TODO: TEMPORANEO
        //IN ORDINE: SCEGLI_FAZIONE
        const CHANNEL_IDS = ["1412775711105875968"];
        const MSG_IDS: string[] = ["1463180162077036658"];
        const fetchChannels = await (await this.getMainGuild()).channels.fetch();
        const channels = CHANNEL_IDS.map((c) => fetchChannels.find((c1) => c1!.id == c));
        const roles = await (await this.getMainGuild()).roles.fetch();
        const confirmedRole = roles.find((val) => val.id == "1409561282755166218");

        const cymRoles = roles.filter((val) => {
            return val.id == "1402793516500783124"
                || val.id == "1402793599661506590"
                || val.id == "1402793806558134323"
                || val.id == "1402793755211464786"
                || val.name == "Jolly";
        }
        );
        //log("LENGTH: " + cymRoles.size);
        const guildEmojis = await (await this.getMainGuild()).emojis.fetch();
        const botEmojis = await this.client.application?.emojis.fetch();
        const bulletMk = guildEmojis.find((e) => e.name == "bulletmk");
        const cross = botEmojis?.find((e) => e.name == "cross");
        const check = botEmojis?.find((e) => e.name == "check");
        const bandierina = botEmojis?.find((e) => e.name == "bandierina");

        const cantRole = roles.find((val) => val.id == "1466776634962083980");
        const iscrittoEventoRole = roles.find((val) => val.id == "1381578216598274150");

        const emojis = this.client.application?.emojis.fetch();
        let roleToEmoji = new Map();
        roleToEmoji.set("1402793806558134323", (await emojis!).find((e) => e.id == "1463136278156546167")?.id);
        roleToEmoji.set("1402793599661506590", (await emojis!).find((e) => e.id == "1463136281046552646")?.id);
        roleToEmoji.set("1402793755211464786", (await emojis!).find((e) => e.id == "1463136276747259934")?.id);
        roleToEmoji.set("1402793516500783124", (await emojis!).find((e) => e.id == "1463136279708307522")?.id);
        roleToEmoji.set("1419071243419783358", (await emojis!).find((e) => e.id == "1463166619642499134")?.id);
        this.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) {
                return;
            }
            if (cymRoles.find((role) => { return role.id == interaction.customId }) == undefined) {
                if(interaction.customId != "unsub"){
                    return;
                }
            }

            const foundRole = cymRoles.find((role) => { return role.id == interaction.customId })!;
            const member = await (await this.getMainGuild()).members.fetch(interaction.user.id);
            if (interaction.customId == "unsub") {
                for (const role of cymRoles) {
                    if (member.roles.cache.has(role[1].id)) {
                        await member.roles.remove(role[1]);
                    }
                }
                await replyEphemeral(interaction, "Ruoli modificati");
                return;
            }

            if (true) {
                await member.roles.remove(foundRole);
                await replyEphemeral(interaction, "Ruoli modificati");
                return;
            }
            else {
                for (const role of cymRoles) {
                    if (member.roles.cache.has(role[1].id)) {
                        await member.roles.remove(role);
                    }
                }
                await member.roles.add(foundRole);
                await replyEphemeral(interaction, "Ruoli modificati");
            }
        })

        async function refreshChooseYourMemeMsg() {
            let castChannels!: Array<TextChannel>;

            castChannels = channels.map((c) => c as TextChannel);
            if (true) {
                let msgs = [];
                for (let i = 0; i < castChannels.length; i++) {
                    msgs.push(await castChannels[i].messages.fetch(MSG_IDS[i]));
                }

                let rolesMembers = new Map<String, String>();
                let totalCounter = 0;

                for (const _role of cymRoles) {
                    totalCounter += _role[1].members.size;
                    const role = _role[1];
                    let msg = "";

                    let members = role.members;
                    members.sort((a, b) => {
                        if (a.roles.cache.has(confirmedRole!.id)
                            && b.roles.cache.has(confirmedRole!.id)) {
                            return 0;
                        }

                        if (a.roles.cache.has(confirmedRole!.id)) {
                            return -1;
                        }
                        if (b.roles.cache.has(confirmedRole!.id)) {
                            return 1;
                        }
                        return 0;
                    });

                    if (true) {
                        let trail = "";
                        let counter = 1;
                        for (const m of members!) {
                            let checkin = "" as any;
                            if (m[1].roles.cache.has(confirmedRole!.id)) {
                                checkin = check as any;
                            }
                            else if (m[1].roles.cache.has(cantRole!.id)) {
                                checkin = cross as any;
                            }
                            let isIscritto = "" as any;
                            if (m[1].roles.cache.has(iscrittoEventoRole!.id)) {
                                isIscritto = bandierina as any;
                            }
                            msg += trail;
                            msg += ` > ${inlineCode(counter.toString() + ".")} <@${m[1].id}> (${m[1].displayName}) ${isIscritto} ${checkin}`;
                            counter += 1;
                            msg += "\n";
                        }
                    }

                    let line = "";
                    if (role.name == "Jolly") {
                        line = "";
                    }

                    let checkinCounter = "";
                    if (role.name != "Jolly") {

                        let confirmedCount = 0;
                        for (const m of role.members) {
                            if (m[1].roles.cache.has(confirmedRole!.id)) {
                                confirmedCount += 1;
                            }
                        }
                        if (confirmedCount != 0) {
                            checkinCounter = ` (${confirmedCount}${check})`;
                        }
                    }

                    if (true)
                        rolesMembers.set(`${line}### ${bulletMk} ${(await (await Application.getInstance().getMainGuild()).client.application!.emojis.fetch(roleToEmoji.get(role.id)))} **${role.name}** (${role.members.size})${checkinCounter}`, msg);
                    else
                        rolesMembers.set(`${bulletMk} **${role.name}** (${role.members.size})`, msg);
                }

                totalCounter -= roles.find((role) => role.name == "Jolly")?.members.size || 0;

                let finalMsg = "";
                let trail = "";
                finalMsg += `# TABELLA LIVE ISCRIZIONI (${totalCounter})\n`;
                for (const entry of rolesMembers) {
                    finalMsg += trail;
                    finalMsg += entry[0] + "\n";
                    finalMsg += entry[1];
                    trail = "";
                }

                log(finalMsg.length);
                const MAX_EMBED_DESC = 4096;
                const MAX_EMBEDS = 10;

                // Helper function to split text by newlines if it's too long
                function splitByNewlines(str: string, maxSize: number): string[] {
                    const out: string[] = [];
                    let start = 0;
                    while (start < str.length) {
                        const end = Math.min(start + maxSize, str.length);
                        if (end === str.length) {
                            out.push(str.slice(start, end));
                            break;
                        }
                        const lastNewline = str.lastIndexOf("\n", end - 1);
                        if (lastNewline > start) {
                            out.push(str.slice(start, lastNewline + 1));
                            start = lastNewline + 1;
                        } else {
                            out.push(str.slice(start, end));
                            start = end;
                        }
                    }
                    return out;
                }

                // Build embeds by category: add categories until we hit the limit, split if needed
                const chunks: string[] = [];
                let currentChunk = `# TABELLA LIVE ISCRIZIONI (${totalCounter})\n`;
                let embedCount = 0;

                for (const entry of rolesMembers) {
                    const categoryHeader = entry[0] + "\n";
                    const categoryMembers = entry[1];
                    const categoryContent = categoryHeader + categoryMembers;

                    // Check if adding this category would exceed the limit
                    if (currentChunk.length + categoryContent.length > MAX_EMBED_DESC && currentChunk !== `# TABELLA LIVE ISCRIZIONI (${totalCounter})\n`) {
                        // Current chunk has content and adding this category exceeds limit
                        chunks.push(currentChunk);
                        embedCount++;
                        currentChunk = categoryContent;
                    } else if (categoryContent.length > MAX_EMBED_DESC) {
                        // Category itself is too large, must split it by newlines
                        if (currentChunk !== `# TABELLA LIVE ISCRIZIONI (${totalCounter})\n`) {
                            chunks.push(currentChunk);
                            embedCount++;
                        }
                        const splits = splitByNewlines(categoryContent, MAX_EMBED_DESC);
                        chunks.push(...splits.slice(0, -1));
                        embedCount += splits.length - 1;
                        currentChunk = splits[splits.length - 1];
                    } else {
                        // Add category to current chunk
                        currentChunk += categoryContent;
                    }

                    if (embedCount >= MAX_EMBEDS) break;
                }

                // Add remaining chunk
                if (currentChunk !== `# TABELLA LIVE ISCRIZIONI (${totalCounter})\n` && embedCount < MAX_EMBEDS) {
                    chunks.push(currentChunk);
                }

                const embedImageUrl = "https://cdn.discordapp.com/attachments/1376213461251526797/1463167072480661684/GqD0yy0.png?ex=6970d806&is=696f8686&hm=550197289828bb3ac19b3da882b333d4d3257b4623131768a5a1f21c2fcde2d6&";
                const embeds = chunks.map((c, idx) => {
                    const e = new EmbedBuilder()
                        .setColor(Globals.STANDARD_HEX_COLOR)
                        .setDescription(c);
                    if (idx === 0) {
                        //e.setImage(embedImageUrl);
                    }
                    return e.toJSON();
                });

                for (const msg of msgs) {
                    if (!msg) {
                        return;
                    }
                    await msg.edit({
                        content: null,
                        embeds: embeds
                    });
                }
            }

            else {
                for (const ch of castChannels) { await ch.send({ content: "." }); }
                let l_Roles = [];
                for (const role of cymRoles) {
                    l_Roles.push(role[1]);
                }
                sendButtonsMsg(l_Roles, channels[0]!, roleToEmoji);
            }
        }

        function sendButtonsMsg(roles: Role[], channel: Channel, rolesToEmojis?: Map<String, ApplicationEmoji | undefined>) {
            let msg = `## SCEGLI LA TUA FAZIONE
Utilizza i pulsanti qui sotto per unirti alla squadra che preferisci e accedere al canale riservato.
Se invece ti va bene essere inserito in qualsiasi squadra senza preferenze, seleziona il ruolo Jolly: sarai di grande aiuto per l’organizzazione!`;

            let buttons = []
            for (const role of roles) {
                if (role.name == "Jolly") {
                    buttons.push(
                        new ButtonBuilder()
                            .setCustomId(role.id)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Success)
                            .setEmoji(rolesToEmojis?.get(role.id)!)
                    );
                }
                else {
                    buttons.push(
                        new ButtonBuilder()
                            .setCustomId(role.id)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(rolesToEmojis?.get(role.id)!)
                    );
                }
            }

            let disiscriviti = new ButtonBuilder()
            .setLabel("Disiscriviti")
            .setCustomId("unsub")
            .setStyle(ButtonStyle.Danger)

            let embed = new EmbedBuilder()
                .setDescription(msg)
                .setColor(Globals.STANDARD_HEX_COLOR)
                .setImage("https://cdn.discordapp.com/attachments/1376213461251526797/1463169160686342328/SDRn6EK.png?ex=6970d9f8&is=696f8878&hm=c3f5257da9bfaa107222fcdcb7e6d0ab6ab23ab766f5039280ab71a72703b6c0&")
                .toJSON();

            if (channel.isSendable()) {
                channel.send({
                    content: undefined,
                    embeds: [embed],
                    components: [new ActionRowBuilder().addComponents(buttons).toJSON(), new ActionRowBuilder().addComponents(disiscriviti).toJSON()]
                })
            }
        }

        refreshChooseYourMemeMsg();
        this.client.on("guildMemberUpdate", refreshChooseYourMemeMsg);



        //TODO END


        let server = express();
        server.get("/", (req, res) => { res.send("MKW Italia Bot is running") });
        server.get("/ping", (req, res) => { res.send("pong") });
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