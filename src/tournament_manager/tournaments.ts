import { managerToFetchingStrategyOptions, Message, ThreadMemberFlagsBitField } from "discord.js";
import { Application } from "../application";
import { ObjectId } from "mongodb";
import { TournamentRepo } from "./tournament_repo";
import { log } from "../log";
import { prop } from "@typegoose/typegoose";

export class TournamentPlayerEntry {
    public playerId: string;
    public joinDateTime: Date;
    public displayName: string;

    public constructor(playerId: string, joinDateTime: Date, displayName: string = "") {
        this.playerId = playerId;
        this.joinDateTime = joinDateTime;
        this.displayName = displayName;
    }
}

export class Tournament {
    @prop({ required: true, type: Date })
    private dateTime: Date;

    @prop({ required: true, type: Date })
    public bracket2Date?: Date;

    @prop({ required: true, type: String })
    private name: string;

    @prop({ required: true, type: ObjectId })
    private id?: ObjectId;

    @prop({ required: true, type: Array<TournamentPlayerEntry> })
    private players: TournamentPlayerEntry[] = [];

    @prop({ required: false, type: String })
    private description?: string;

    @prop({ required: false, type: String })
    private serverMessage?: Message;

    @prop({ required: true, type: Boolean })
    public isTournament: boolean = true;

    @prop({ required: true, type: Map })
    private mode?: String;

    @prop({ required: false, type: Number })
    private nRaces?: Number;
    
    @prop({ required: false, type: Number })
    private minPlayers?: Number;

    @prop({ required: false, type: Number })
    private maxPlayers?: Number;

    public constructor(dateTime: Date, name: string) {
        this.dateTime = dateTime;
        this.name = name;

        this.id = new ObjectId();
    }

    public setId(id: ObjectId) {
        this.id = id;
    }

    public setSecondBracketDate(date: Date) {
        this.bracket2Date = date;
    }

    public getSecondBracketDate() {
        return this.bracket2Date;
    }

    public setMode(mode: string) {
        this.mode = mode;
    }

    public getMode() {
        return this.mode;
    }

    public setNumberOfRaces(n: number) {
        this.nRaces = n;
    }

    public getNumberOfRaces() {
        return this.nRaces;
    }

    public setMinPlayers(n: number) {
        this.minPlayers = n;
    }

    public getMinPlayers() {
        return this.minPlayers;
    }

    public setMaxPlayers(n: number) {
        this.maxPlayers = n;
    }

    public getMaxPlayers() {
        return this.maxPlayers;
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

    public addPlayer(userId: string, displayName: string = "") {
        if (!this.players.find((entry) => entry.playerId === userId)) {
            this.players.push(new TournamentPlayerEntry(userId, new Date(), displayName));
        }
    }

    public removePlayer(userId: string) {
        const index = this.players.findIndex((entry) => entry.playerId === userId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }

    public isPlayerPartecipating(userId: string): boolean {
        for (const player of this.players) {
            if (player.playerId === userId) {
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

    public getPlayers(): TournamentPlayerEntry[] {
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

    public async getTournaments(includeOtherEvents: boolean = true): Promise<Tournament[]> {
        return this.tournaments.getAllTournaments(includeOtherEvents);
    }

    public async getTournamentById(uuid: ObjectId | string): Promise<Tournament | undefined> {
        if (uuid instanceof String) {
            uuid = new ObjectId(uuid);
        }

        return this.tournaments.getTouruamentById(uuid as ObjectId);
    }

}
