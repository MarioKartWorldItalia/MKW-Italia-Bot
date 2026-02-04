import { ActionRowBuilder, inlineCode, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { dBGetFriendCode } from "../../frend_codes";
import { awaitModalSubmit, replyEphemeral } from "../../utils";
import { log } from "../../log";
import { Application } from "../../application";
import { randomUUID } from "crypto";
import { ButtonOrModalCommandBase, InteractionOptions } from "../interaction_base_classes";

export class SearchFc extends ButtonOrModalCommandBase {
    override get commandName(): string {
        return "searchfc";
    }

    override async exec(options: InteractionOptions): Promise<void> {
        const interaction = options.interaction;
        let replyInteraction: ModalSubmitInteraction | undefined = undefined;

        if (!interaction.isButton())
            return;
            
        const modal = new ModalBuilder()
            .setCustomId("searchfc_modal" + " " + randomUUID())
            .setTitle("Cerca Codice Amico Utente")
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId("user_tag")
                        .setLabel("Username dell'utente")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            )
        await interaction.showModal(modal);
        replyInteraction = await awaitModalSubmit(interaction);
        if (!replyInteraction) {
            log("Modal submit for friend code search timed out");
            return;
        }
        
        const userTag = replyInteraction.fields.getTextInputValue("user_tag").toLowerCase();

        const guild = await Application.getInstance().getMainGuild();

        let member = guild.members.cache.find(m => m.user.tag.toLowerCase() === userTag);
        if (!member) {
            member = guild.members.cache.find(m => m.user.displayName.toLowerCase() === userTag)
        }
        if (!member) {
            member = guild.members.cache.find(m => m.user.globalName?.toLowerCase() === userTag)
        }
        if (!member) {
            member = guild.members.cache.find(m => m.nickname?.toLowerCase() === userTag)
        }

        if (!member) {
            await replyEphemeral(replyInteraction, "Non è stato trovato alcun giocatore con il nome inserito");
        }

        else {
            const fc = await dBGetFriendCode(member.user);
            if (!fc) {
                await replyEphemeral(replyInteraction, `<@${member.id}> non ha un codice amico registrato`);
                return;
            }
            await replyEphemeral(replyInteraction, `Il codice amico di <@${member.id}> è: ${inlineCode(fc.toString())}`);
        }
    }
}
