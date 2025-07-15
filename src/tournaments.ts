import { managerToFetchingStrategyOptions, Message, ThreadMemberFlagsBitField } from "discord.js";
import { Application } from "./application";
import { v7 as uuid7 } from "uuid";

export class Tournament {
    private dateTime: Date;
    private name: string;
    private uuid: string;
    private players: string[] = [];
    private serverMessage: Message | undefined;

    public constructor(dateTime: Date, name: string, uuid?: string) {
        this.dateTime = dateTime;
        this.name = name;

        if (uuid) {
            this.uuid = uuid;
        }

        //generates a uuid based on the date and time
        this.uuid = uuid7();
    }

    public setServerMessage(msg: Message) {
        this.serverMessage = msg;
    }

    public getServerMessage() {
        return this.serverMessage;
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

    public getUuid(): string {
        return this.uuid;
    }

    public getPlayers(): string[] {
        return [...this.players];
    }
}

export class TournamentManager {
    readonly tournaments: Tournament[];

    public constructor() {
        this.tournaments = [];
    }

    public addTournament(tournament: Tournament) {
        this.tournaments.push(tournament);


    }

    public removeTournament(tournament: Tournament) {
        const index = this.tournaments.indexOf(tournament);
        if (index !== -1) {
            this.tournaments.splice(index, 1);
        }
    }

    public getTournaments(): Tournament[] {
        return this.tournaments;
    }

    public getTournamentById(uuid: string): Tournament | undefined {
        return this.tournaments.find(tournament => tournament.getUuid() === uuid);
    }
}
