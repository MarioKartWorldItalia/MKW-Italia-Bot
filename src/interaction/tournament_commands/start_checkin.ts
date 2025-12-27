import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { checkAndPopulateAutocomplete } from "./common";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { Globals } from "../../globals";
import { CheckInButton } from "./checkin";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class StartCheckInCommand extends SlashCommandBase {
    override get builder() {
        return new SlashCommandBuilder()
            .setName("start_checkin")
            .setDescription("Avvia il check-in per un torneo")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("tournament_id")
                    .setDescription("Seleziona un evento")
                    .setAutocomplete(true)
                    .setRequired(true)
            ).toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (options.interaction.isAutocomplete()) {
            await checkAndPopulateAutocomplete(options.interaction);
            return;
        }

        if (!(options.interaction instanceof ChatInputCommandInteraction)) {
            throw new TypeError();
        }

        const id = options.getRequiredStringOption("tournament_id");
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);
        const checkinChannelid = tournament?.tournamentChannelId;
        if (!tournament) {
            await replyEphemeral(options.interaction, "Torneo non trovato");
            return;
        }

        if (!checkinChannelid) {
            await replyEphemeral(options.interaction, "Il torneo non ha un canale associato");
            return;
        }

        const checkinMsg = "CHECKIN-MSG-TEMPLATE";
        const guild = await Application.getInstance().getMainGuild();
        const channel = await guild.channels.fetch(checkinChannelid);


        let embed = new EmbedBuilder()
            .setColor(Globals.STANDARD_HEX_COLOR)
            .setTitle(`Check-in per il torneo ${tournament.getName()}`)
            .setDescription(checkinMsg);

        const components = new ActionRowBuilder<ButtonBuilder>().addComponents(new CheckInButton().getButton(tournament._id!.toString()));
        if (channel?.isSendable()) {
            await channel.send(
                {
                    embeds: [embed],
                    components: [components]
                }
            )
        }

        
        options.interaction.reply({
            content: "Check-in avviato",
            flags: MessageFlags.Ephemeral
        })

    }
}