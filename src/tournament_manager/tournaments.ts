import { managerToFetchingStrategyOptions, Message, ThreadMemberFlagsBitField } from "discord.js";
import { Application } from "../application";
import { ObjectId } from "mongodb";
import { TournamentRepo } from "./tournament_repo";
import { TournamentSchema } from "../database/models/tournament_model";
import { log } from "../logging/log";

export class Tournament {
    private dateTime: Date;
    private name: string;
    private id?: ObjectId;
    private players: string[] = [];
    private description?: string;
    private serverMessage: Message | undefined;

    public constructor(dateTime: Date, name: string) {
        this.dateTime = dateTime;
        this.name = name;
        
        this.id = new ObjectId();
    }

    public setId(id: ObjectId) {
        this.id = id; 
    }

    public static async fromSchema(doc: TournamentSchema): Promise<Tournament> {
        let ret = new Tournament(doc.startDateTime, doc.tournamentName.toString());
        ret.setId(doc._id);
        ret.setDescription(doc.description?.toString());
        if (doc.serverMessageId && doc.serverMessageChannelId) {
            const mainGuild = await Application.getInstance().getMainGuild();
            const channel = await mainGuild.channels.fetch(doc.serverMessageChannelId.toString());
            if (channel?.isTextBased()) {
                const msg = await channel.messages.fetch(doc.serverMessageId.toString());
                ret.serverMessage = msg;
            }
        }
        ret.players = doc.parteciparingPlayers as string[];
        return ret;
    }

    public setServerMessage(msg?: Message) {
        this.serverMessage = msg;
    }

    public getServerMessage() {
        return this.serverMessage;
    }

    public getDescription() {
        return this.description;
    }

    public setDescription(str?: string) {
        this.description = str;
    }

    public addPlayer(userId: string) {
        if (!this.players.includes(userId)) {
            this.players.push(userId);
        }
    }

    public removePlayer(userId: string) {
        const index = this.players.indexOf(userId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }

    public isPlayerPartecipating(userId: string): boolean {
        for (const player of this.players) {
            if (player === userId) {
                return true;
            }
        }
        return false;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setDateTime(dateTime: Date) {
        this.dateTime = dateTime;
    }

    public getName(): string {
        return this.name;
    }

    public getDateTime(): Date {
        return this.dateTime;
    }

    public getId() {
        return this.id;
    }

    public getPlayers(): string[] {
        return [...this.players];
    }
}

export class TournamentManager {
    tournaments: TournamentRepo;

    public constructor() {
        this.tournaments = new TournamentRepo();
    }

    public async setDefaultAddRole(id: string) {
        const db = Application.getInstance().getDb();
        db.getModels();
    }

    public async addTournament(tournament: Tournament) {
        this.tournaments.updateTournament(tournament);
    }

    public async updateTournament(tournament: Tournament) {
        this.addTournament(tournament);
    }

    public async removeTournament(tournament: Tournament) {
        return this.tournaments.removeTournament(tournament);
    }

    public async getTournaments(): Promise<Tournament[]> {
        return this.tournaments.getAllTournaments();
    }

    public async getTournamentById(uuid: ObjectId | string): Promise<Tournament | undefined> {
        if (uuid instanceof String) {
            uuid = new ObjectId(uuid);
        }
        
        return this.tournaments.getTouruamentById(uuid as ObjectId);
    }

}
