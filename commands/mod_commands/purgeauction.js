const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { redtext } = require("../../functions/functions.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purgeah')
        .setDescription('Purges old auctions [Mod Only]')
        .addIntegerOption(option => 
            option.setName("id")
                  .setDescription("Purge until this ID")
                  .setRequired(true)
        )
        .setDMPermission(false),

    async execute(interaction) {
        //check if the user running the command has permission to purge
        //if it is not the owner of the bot (Peli) and does not have moderator role, send them an error message
        if (interaction.user.id !== "492965189038374933") return await interaction.reply({ content: redtext("You cannot use this command!"), ephemeral: true })
        let deletecount = 0
        let delid = interaction.options.getInteger("id")
        for (i = 0; i < listofauctions.length; i++) {
            //loop through the auctions and if it is inactive, splice it out of the data
            //when over, send a summary message of how many has been purged
            let ahcheck = listofauctions[i]
            if (i === listofauctions.length - 1) {
                interaction.reply({ content: "```diff\n-Purged " + deletecount + " entries.\n```", ephemeral: true })
                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4))
            }
            if (ahcheck.active === false && ahcheck.id < delid) {
                listofauctions.splice(i, 1)
                deletecount++
                i--
                continue
            } else continue
        }
    }
}