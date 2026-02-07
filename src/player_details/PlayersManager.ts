import { TypedEmitter } from "tiny-typed-emitter";
import { Application } from "../application";
import { PlayerEntry } from "./PlayerEntry";
import { MMRManager } from "./MMRManager";
import { BeAnObject, ReturnModelType } from "@typegoose/typegoose/lib/types";

interface PlayerEvent {
    update: (player: PlayerEntry) => void;
}

export class PlayersEvent extends TypedEmitter<PlayerEvent> {
    constructor() {
        super();
    }
}

export class PlayersManager {
    public emitter: PlayersEvent = new PlayersEvent();
    mmrManager: MMRManager = new MMRManager();
    
    playersRepo!: ReturnModelType<typeof PlayerEntry, BeAnObject>;

    public constructor() { }

    public async start() {
        this.playersRepo = Application.getInstance().getDb().getModels().playersModel;
        await this.mmrManager.start();
    }

    public async updatePlayer(player: PlayerEntry) {
        const res = await this.playersRepo.findOneAndUpdate({playerId: player.playerId}, player).exec();
        if (!res) {
            throw new Error(`Player with id ${player.playerId} not found`);
        }
        this.emitter.emit("update", player);
    }

    public async updateOrCreatePlayer(player: PlayerEntry) {
        let p = await this.playersRepo.findOne({playerId: player.playerId}).exec();
        
        if(!p) {
            await this.playersRepo.create(player);
            this.emitter.emit("update", player);
            return;
        }
        await this.playersRepo.findOneAndUpdate({playerId: player.playerId}, player).exec();
        this.emitter.emit("update", player);
    }

    public async getPlayer(playerId: String): Promise<PlayerEntry | undefined> {
        let res = await this.playersRepo.findOne({playerId: playerId}).exec();

        if (res) {
            return (res as any) as PlayerEntry;
        }
    }

    public async getOrCreatePlayer(playerId: String): Promise<PlayerEntry> {
        let player = await this.getPlayer(playerId);
        if (!player) {
            player = new PlayerEntry(playerId);
            await this.updateOrCreatePlayer(player);
        }
        return player;
    }

    public async getAllPlayers() {
        const res = await this.playersRepo.find().exec();
        let players: PlayerEntry[] = [];
        
        for (const doc of res) {
            const player = (doc as any) as PlayerEntry;
            players.push(player);
        }
        return players;
    }            
}