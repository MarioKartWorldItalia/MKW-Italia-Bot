import { prop } from "@typegoose/typegoose";
import { MMREntry } from "./MMRManager";

export class PlayerEntry {
    @prop({required: true})
    private playerId: String;

    @prop({ _id: false })
    private MMR?: MMREntry;

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