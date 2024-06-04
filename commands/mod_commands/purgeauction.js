const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { redtext } = require("../../data/functions.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purgeah')
        .setDescription('Purges old auctions [Mod Only]'),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has('1242723431548456970')) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        let deletecount = 0
        for (i = 0; i < listofauctions.length; i++) {
            let ahcheck = listofauctions[i]
            if (i === listofauctions.length - 1) {
                interaction.reply({ content: "```diff\n-Purged " + deletecount + " entries.\n```", ephemeral: true })
                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4))
            }
            if (ahcheck.active === false) {
                listofauctions.splice(i, 1)
                deletecount++
                continue
            } else continue
        }
    }
}