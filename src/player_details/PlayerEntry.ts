import { prop } from "@typegoose/typegoose";
import { MMR as MMR } from "./MMRManager";

export class PlayerEntry {
    @prop({required: true})
    public playerId: String;

    @prop({ _id: false })
    public MMR?: MMR;

    constructor(playerid: String) {
        this.playerId = playerid;
    }

    public setMMR(MMR: MMR) {
        this.MMR = MMR;
    }

    public getMMR(): MMR | undefined {
        return this.MMR;
    }
}