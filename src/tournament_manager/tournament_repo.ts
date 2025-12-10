import { Document, Model, Schema } from "mongoose";
import { TournamentSchema } from "../database/models/tournament_model";
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
        let schema = new TournamentSchema();
        schema.setValues(tournament);
        const update = await this.tournaments.updateOne(
            {_id: tournament.getId()},
            {$set: schema},
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
            tArr.push(await Tournament.fromSchema(res[i]));
        }
        return tArr;
    }

    public async getTouruamentById(id: ObjectId) {
        let res = await this.tournaments.findById(id).exec();

        if (res) {
            return Tournament.fromSchema(res);
        }
    }
}


