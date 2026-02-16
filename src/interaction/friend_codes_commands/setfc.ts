import { ActionRowBuilder, ModalBuilder, ModalSubmitInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder, SlashCommandStringOption, TextInputBuilder, TextInputStyle } from "discord.js";
import { dBAddFriendCode, FriendCode, InvalidFriendCode } from "../../frend_codes";
import { awaitModalSubmit, replyEphemeral } from "../../utils";
import { log } from "../../log";
import { randomUUID } from "crypto";
import { refreshFriendCodesMessage } from "./shared";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";

export class SetFc extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("setfc")
            .setDescription("Aggiungi un codice amico")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("codice")
                    .setDescription("Inserisci il codice amico come mostrato sulla console")
                    .setRequired(true)
            )
            .toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        const interaction = options.interaction;
        let replyInteraction: ModalSubmitInteraction | undefined = undefined;
        let code;
        
        if (interaction.isChatInputCommand()) {
            code = interaction.options.getString("codice", true);
            replyInteraction = interaction as unknown as ModalSubmitInteraction;
        }
        else if (interaction.isButton()) {
            const modal = new ModalBuilder()
                .setCustomId("setfc_modal id:" + randomUUID())
                .setTitle("Aggiungi Codice Amico")
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId("codice")
                            .setLabel("Codice amico")
                            .setPlaceholder("Inserisci il codice amico come mostrato sulla console")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Paragraph)
                    )
                );
            
            await interaction.showModal(modal);
            
            replyInteraction = await awaitModalSubmit(interaction);
            if(!replyInteraction) {
                log("Modal submit for friend code addition timed out");
                return;
            }
            code = replyInteraction.fields.getTextInputValue("codice");
        }
        else {
            throw new Error();
        }

        try {
            const fc = new FriendCode(code);
            await dBAddFriendCode(interaction.user, fc);
            await replyEphemeral(replyInteraction!, `Codice amico ${fc.toString()} aggiunto correttamente. Se era già presente un codice amico, questo verrà sovrascritto`);
        }
        catch (e) {
            if (e instanceof InvalidFriendCode) {
                await replyEphemeral(replyInteraction!, "Il codice amico inserito non è valido. Assicurati di averlo scritto correttamente come mostrato sulla console (es. SW-1234-5678-9012)");
                return;
            }
            throw e;
        }
        await refreshFriendCodesMessage();
    }
}
