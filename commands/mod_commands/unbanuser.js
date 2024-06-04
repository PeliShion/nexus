const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { greentext, redtext } = require('../../data/functions')

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
        let user = interaction.options.getUser("user")
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has('1242723431548456970')) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        let i = 0;
        while(i < bannedusers.length) {
            if(bannedusers[i] === user.id) {
                bannedusers.splice(i, 1)
            } else i++
        }
        fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4))
        await interaction.reply({ content: greentext(`You have successfully unbanned ${user.username}!`), ephemeral: true })
    }
}