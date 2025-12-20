import { Document, Model, Schema } from "mongoose";
import { Application } from "../application";
import { Tournament } from "./tournaments";
import { ObjectId } from "mongodb";
import { errors } from "@typegoose/typegoose";
import { log } from "../log";

export class TournamentRepo {
    private tournaments;

    public constructor() {
        this.tournaments = Application.getInstance().getDb().getModels().tournamentModel;
    }

    public async updateTournament(tournament: Tournament) {
        const update = await this.tournaments.updateOne(
            {_id: tournament.getId()},
            {$set: tournament},
            {upsert: true}
        ).exec();
    }

    public async removeTournament(tournament: Tournament) {
        await this.tournaments.findByIdAndDelete(tournament.getId()).exec();
    }

    public async getAllTournaments(includeOtherEvents: boolean): Promise<Tournament[]> {
        let res = await this.tournaments.find().exec();

        let tArr = new Array<Tournament>();
        for (let i = 0; i < res.length; i++) {
            tArr.push(res[i].toObject());
        }
        return tArr;
    }

    public async getTouruamentById(id: ObjectId): Promise<Tournament | undefined> {
        let res = await this.tournaments.findById(id).exec();

        if (res) {
            return res.toObject();
        }
    }
}


