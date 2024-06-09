const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { greentext, redtext } = require('../../functions/functions.js')
const { modroleid } = require("../../data/settings.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unbanuser")
        .setDescription("Unban a user from the bot [Mod Only]")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User you would like to unban")
                .setRequired(true)
        ),
    async execute(interaction) {
        let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
        let bannedusers = settings.bannedusers
        let user = interaction.options.getUser("user")//turning collected argument into variable

        //check if the user running the command has permission to remove bids
        //if it is not the owner of the bot (Peli) and does not have moderator role, send them an error message
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has(modroleid)) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        let i = 0;
        while (i < bannedusers.length) {
            //loop through the banned users array and splice the entries if matching
            if (bannedusers[i] === user.id) {
                bannedusers.splice(i, 1)
                i++
            } else i++
        }
        fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4))
        await interaction.reply({ content: greentext(`You have successfully unbanned ${user.username}!`), ephemeral: true })
    }
}