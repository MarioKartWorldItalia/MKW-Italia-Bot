import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { Application } from "../../application";
import { PlayerEntry } from "../../player_details/PlayerEntry";
import { MMR, Rank } from "../../player_details/MMRManager";

export class MockRankUpCommand extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("mock_rank_up")
            .setDescription("Mock command to rank up a player");
    }

    public async exec(options: InteractionOptions): Promise<void> {
        for (let i = 0; i < 10; i++) {
            let player = new PlayerEntry(options.getInteractionUser().id);
            const oldRank = Rank.Iron;
            player.MMR = new MMR("test", 100, 12, i);
            Application.getInstance().getPlayersManager().emitter.emit("rankChange", player, oldRank, player.MMR.rank);
        }

        for (let i = 9; i >= 0; i--) {
            let player = new PlayerEntry(options.getInteractionUser().id);
            const oldRank = Rank.Grandmaster;
            player.MMR = new MMR("test", 100, 12, i);
            Application.getInstance().getPlayersManager().emitter.emit("rankChange", player, oldRank, player.MMR.rank);
        }
    }
}