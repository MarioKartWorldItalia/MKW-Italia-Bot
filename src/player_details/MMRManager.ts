import axios from "axios";
import * as cheerio from 'cheerio';
import { BotDefaults } from "../globals";
import { prop } from "@typegoose/typegoose";

export class MMREntry {
    @prop({ required: true })
    public MCKPlayerId: string;
    
    @prop({ required: true })
    public MMR: number; //last fetched MMR

    constructor(MCKPlayerId: string, MMR: number) {
        this.MCKPlayerId = MCKPlayerId;
        this.MMR = MMR;
    }

    public getMMRValue(): number {
        return this.MMR;
    }

    public static async getMMRFromLink(url: string): Promise<MMREntry> {
        const playerId = this.getPlayerIdFromUrl(url);
        const mmr = await this.getMMRFromPlayerId(playerId);
        return new MMREntry(playerId, mmr);
    }

    private static async getMMRFromPlayerId(playerId: string): Promise<number> {
        const url = `https://lounge.mkcentral.com/mkworld/PlayerDetails/${playerId}?season=${(await BotDefaults.getDefaults()).mkCentralSeason}`;
        return MMREntry.scrapeMMR(url);
    }

    public async getMMRLink(): Promise<string> {
        const season = (await BotDefaults.getDefaults()).mkCentralSeason;
        return `https://lounge.mkcentral.com/mkworld/PlayerDetails/${this.MCKPlayerId}?season=${season}`;
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
}

export class MMRManager {
    public constructor() { }

    public async start() {
        //todo
    }

    public async updateAllMMRs() {
        //todo
    }
}