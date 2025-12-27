import { TypedEmitter } from "tiny-typed-emitter";
import { Tournament } from "./tournaments";

interface TournamentEvents {
    update: (tournament: Tournament) => void;
    remove: (tournament: Tournament) => void;
}

export class TournamentEvent extends TypedEmitter<TournamentEvents> {
    public constructor() {
        super();
    }
}