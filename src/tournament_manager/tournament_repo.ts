import { Model } from "mongoose";
import { TournamentSchema } from "../database/models/tournament_model";
import { Application } from "../application";

class TournamentRepo {
    private tournaments: Model<TournamentSchema>;

    public constructor() {
        this.tournaments = Application.getInstance().getDb().getModels().tournamentModel;
        this.tournaments.create({});
    }
}