const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { greentext, redtext } = require('../../functions/functions.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banuser")
        .setDescription("Ban a user from making/bidding on an auction [Mod Only]")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User you would like to ban")
                .setRequired(true)
        ),
    async execute(interaction) {
        let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
        let bannedusers = settings.bannedusers
        let user = interaction.options.getUser("user") //turn the collected argument into variable

        //check if the user running the command has permission to ban
        //if it is not the owner of the bot (Peli) and does not have moderator role, send them an error message
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has('1242723431548456970')) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        
        //if the user is valid, push the user to banned users array and save it 
        bannedusers.push(user.id)
        fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4))
        await interaction.reply({ content: greentext(`You have successfully banned ${user.username}!`), ephemeral: true })
    }
}