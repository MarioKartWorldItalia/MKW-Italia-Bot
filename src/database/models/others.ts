import { prop } from "@typegoose/typegoose";

export class Others {
    @prop({type: Date, required: true, default: new Date()})
    public latestIGPost: Date = new Date();
}