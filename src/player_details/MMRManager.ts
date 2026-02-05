import axios from "axios";
import * as cheerio from 'cheerio';
import { BotDefaults } from "../globals";
import { prop } from "@typegoose/typegoose";
import { log } from "../log";

export enum Rank {
    Iron = 0,
    Bronze,
    Silver,
    Gold,
    Platinum,
    Sapphire,
    Ruby,
    Diamond,
    Master,
    Grandmaster,
}

enum MogiType {
    p12 = 12,
    p24 = 24,
}

export class MMR {
    @prop({ required: true })
    public MKCLoungeId: string;
    
    @prop({ required: true })
    public MMR: number; //last fetched MMR

    @prop({ required: true })
    public mogiType: MogiType;

    @prop({ required: true })
    public rank: Rank;

    constructor(MKCLoungeId: string, MMR: number, mogiType: MogiType, rank: Rank) {
        this.MKCLoungeId = MKCLoungeId;
        this.MMR = MMR;
        this.mogiType = mogiType;
        this.rank = rank;
    }

    public getMMRValue(): number {
        return this.MMR;
    }

    public static async getHighestMMR(id: string): Promise<MMR> {
        const p12MMR = await this.getMMRFromPlayerId(id, MogiType.p12);
        const p24MMR = await this.getMMRFromPlayerId(id, MogiType.p24);

        let mmr = 0;
        let mogi: MogiType;
        if(p12MMR >= p24MMR) {
            mmr = p12MMR;
            mogi = MogiType.p12;
        }
        else {
            mmr = p24MMR;
            mogi = MogiType.p24;
        }
        return new MMR(id, mmr, mogi, this.getRankFromMMR(mmr, mogi));
    }

    public static async getMMRFromLink(url: string, mogiType: MogiType): Promise<MMR> {
        const playerId = this.getPlayerIdFromUrl(url);
        const mmr = await this.getMMRFromPlayerId(playerId, mogiType);
        return new MMR(playerId, mmr, mogiType, this.getRankFromMMR(mmr, mogiType));
    }

    private static async getMMRFromPlayerId(playerId: string, mogiType: MogiType): Promise<number> {
        const url = `https://lounge.mkcentral.com/mkworld/PlayerDetails/${playerId}?season=${(await BotDefaults.getDefaults()).mkCentralSeason}&p=${mogiType}`;
        return MMR.scrapeMMR(url);
    }

    public async getMMRLink(): Promise<string> {
        const season = (await BotDefaults.getDefaults()).mkCentralSeason;
        return `https://lounge.mkcentral.com/mkworld/PlayerDetails/${this.MKCLoungeId}?season=${season}&p=${this.mogiType}`;
    }

    public static getPlayerIdFromUrl(url: string): string {
        const cleanUrl = url.trim();
        const patterns = [
            /\/PlayerDetails\/(\d+)/i,
            /PlayerDetails[\/:](\d+)/i, 
            /player[_-]?details[\/:](\d+)/i,
        ];
        
        for (const pattern of patterns) {
            const match = cleanUrl.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        throw new Error(`Invalid player details URL. URL fornito: "${cleanUrl}". Formato atteso: https://lounge.mkcentral.com/mkworld/PlayerDetails/[ID]`);
    }

    private static async scrapeMMR(url: string) {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        const mmrLabel = $('div, span, p, label, b, strong')
            .filter((_: number, el: any) => {
                return $(el).text().includes('MMR');
            })
            .last();

        if (mmrLabel.length > 0) {
            const parent = mmrLabel.parent();
            const fullText = parent.text().trim();

            const valueMatch = fullText.match(/MMR\s*[:|-]?\s*([\d,]+)/i);
            if (valueMatch && valueMatch[1]) {
                return Number(valueMatch[1]);
            }
        }
        throw new Error("Cannot scrape MMR")
    }

    public static getRankFromMMR(mmr: number, mogiType: MogiType): Rank {
        const p12Thresholds = [0, 1999, 3999, 5999, 7499, 8999, 10499, 11999, 13499, 14499];
        const p24Thresholds = [0, 1999, 3999, 5999, 7999, 9999, 11499, 12999, 14499, 15499];
        
        let selectedThresholds: number[];
        if (mogiType === MogiType.p12) {
            selectedThresholds = p12Thresholds;
        } else if(mogiType === MogiType.p24) {
            selectedThresholds = p24Thresholds;
        }
        else {
            throw new Error("Invalid mogi type");
        }

        for (let i = selectedThresholds.length - 1; i >= 0; i--) {
            if (mmr >= selectedThresholds[i]) {
                return i as Rank;
            }
        }
        return Rank.Iron;
    }
}