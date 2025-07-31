import { Client, Interaction, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { dBAddFriendCode, dbGetAllFriendCodes, dBGetFriendCode, dBRemoveFriendCode, FriendCode, FriendCodeResult, InvalidFriendCode } from "../frend_codes";
import { replyEphemeral } from "../utils";
import { log } from "../logging/log";

export async function bindFCCommands(client: Client): Promise<Map<String, (i: Interaction)=>Promise<void>>> {
    let commands = [];
    let applicationCommands = client.application?.commands;

    commands.push(
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("aggiungi_fc")
                .setDescription("Aggiungi un codice amico")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("codice")
                        .setDescription("Inserisci il codice amico come mostrato sulla console")
                        .setRequired(true)
                )
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("rimuovi_fc")
                .setDescription("Rimuove il tuo codice amico dalla lista")
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("ottieni_fc")
                .setDescription("Ottieni il codice amico di un utente")
                .addUserOption(option=>{
                    return option.setName("user_id")
                        .setDescription("ID della persona di cui ottenere il codice amico")
                        .setRequired(true);
                })
               ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("admin_set_fc")
                .setDescription("Aggiunge il codice amico di una persona")
                .addUserOption(option=>{
                    return option.setName("user_id")
                        .setDescription("ID della persona a cui aggiungere il codice amico")
                        .setRequired(true);
                })
                .addStringOption(option=>{
                    return option.setName("codice")
                        .setDescription("Codice amico da aggiungere")
                        .setRequired(true);
                })
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("admin_rm_fc")
                .setDescription("Rimuove il codice amico di una persona")
                .addUserOption(option=>{
                    return option.setName("user_id")
                        .setDescription("ID Discord della persona di cui rimuovere il codice amico")
                        .setRequired(true);
                })
        ),
        applicationCommands?.create(
            new SlashCommandBuilder()
                .setName("admin_get_all_fc")
                .setDescription("Ottiene la lista di tutti i codici amico registrati")
        )
    );

   Promise.all(commands).then(()=>{log("Comandi codici amico aggiornati")});
    
   let ret = new Map<String, (i: Interaction)=>Promise<void>>;
   ret.set("aggiungi_fc", onAddFc);
   ret.set("rimuovi_fc", onRemoveFc);
   ret.set("admin_set_fc", onAdminAddFc);
   ret.set("admin_rm_fc", onAdminRemoveFc);
   ret.set("admin_get_all_fc", onAdminGetAllFc);
   ret.set("ottieni_fc", onGetFc);
   return ret;
}

async function onAddFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const code = interaction.options.getString("codice", true);

    try {
        const fc = new FriendCode(code);
        await dBAddFriendCode(interaction.user, fc);
        await replyEphemeral(interaction, `Codice amico ${fc.toString()} aggiunto correttamente`);
    }
    catch (e) {
        if (e instanceof InvalidFriendCode) {
            await replyEphemeral(interaction, "Il codice amico inserito non è valido. Assicurati di averlo scritto correttamente come mostrato sulla console (es. SW-1234-5678-9012)");
            return;
        }
        throw e;
    }
}

async function onRemoveFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    let rm = await dBRemoveFriendCode(interaction.user);
    if(rm == FriendCodeResult.NOT_PRESENT) {
        await replyEphemeral(interaction, "Non hai un codice amico registrato");
        return;
    }
    else if (rm == FriendCodeResult.OK) {
        await replyEphemeral(interaction, "Il tuo codice amico è stato rimosso correttamente");
    }
    
}

async function onGetFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    const user = interaction.options.getUser("user_id", true);
    const fc = await dBGetFriendCode(user);
    if (!fc) {
        await replyEphemeral(interaction, `${user.tag} non ha un codice amico registrato`);
        return;
    }
    await replyEphemeral(interaction, `Il codice amico di ${user.tag} è: ${fc.toString()}`);
}

async function onAdminAddFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const user = interaction.options.getUser("user_id", true);
    const code = interaction.options.getString("codice", true);

    try {
        const fc = new FriendCode(code);
        await dBAddFriendCode(user, fc);
        await replyEphemeral(interaction, `Codice amico ${fc.toString()} aggiunto correttamente a ${user.tag}`);
    }
    catch (e) {
        if (e instanceof InvalidFriendCode) {
            await replyEphemeral(interaction, "Il codice amico inserito non è valido. Assicurati di averlo scritto correttamente come mostrato sulla console (es. SW-1234-5678-9012)");
            return;
        }
        throw e;
    }
}

async function onAdminRemoveFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const user = interaction.options.getUser("user_id", true);

    let rm = await dBRemoveFriendCode(user);
    if(rm == FriendCodeResult.NOT_PRESENT) {
        await replyEphemeral(interaction, `${user.tag} non ha un codice amico registrato`);
        return;
    }
    else if (rm == FriendCodeResult.OK) {
        await replyEphemeral(interaction, `Il codice amico di ${user.tag} è stato rimosso correttamente`);
    }
    
}

async function onAdminGetAllFc(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    
    let friendCodes = await dbGetAllFriendCodes();

    if(friendCodes.size == 0) {
        await replyEphemeral(interaction, "Nessun codice amico registrato");
        return;
    }

    let reply = "Lista codici amico:\n";
    friendCodes.forEach((value, key) => {
        reply = reply.concat(`<@${key}>: ${value.toString()}\n`);
    });
    await replyEphemeral(interaction, reply);
}