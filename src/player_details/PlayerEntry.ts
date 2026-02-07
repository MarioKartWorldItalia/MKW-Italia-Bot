import { prop } from "@typegoose/typegoose";
import { MMREntry } from "./MMRManager";

export class PlayerEntry {
    @prop({required: true})
    public playerId: String;

    @prop()
    public MMR?: MMREntry;

    constructor(playerid: String) {
        this.playerId = playerid;
    }

    public setMMREntry(MMREntry: MMREntry) {
        this.MMR = MMREntry;
    }

    public getMMREntry(): MMREntry | undefined {
        return this.MMR;
    }
}