const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { redtext, greentext } = require("../../data/functions.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deleteah")
        .setDescription("Deletes the auction")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("ID of the auction you want to delete")
                .setRequired(true)
        ),

    async execute(interaction) {
        let selectedid = interaction.options.getInteger("id")
        let selectedah = listofauctions.find(x => x.id === selectedid)
        if (!selectedah) return await interaction.reply({ content: redtext("Could not find an auction with ID " + selectedid + "!"), ephemeral: true })
        let ahowner = selectedah.owner
        if ((interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has('1242723431548456970')) && (interaction.user.id !== ahowner || selectedah.currentbid !== 0)) return await interaction.reply({ content: redtext("You need to be a moderator or the owner of the auction which has 0 bids to use this command!"), ephemeral: true })
        else for (i = 0; i < listofauctions.length; i++) {
            if (listofauctions[i].id === selectedid) {
                listofauctions.splice(i, 1)
                break
            } else continue
        }
        interaction.reply({ content: greentext("Deleted auction #" + selectedid + "!"), ephemeral: true })
        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4))
    }
}