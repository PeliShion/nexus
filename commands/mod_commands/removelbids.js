const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js')
const { redtext, bluetext, greentext } = require('../../data/functions.js')
const fs = require('fs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removebid")
        .setDescription("Removes bid(s) from an auction [Mod Only]")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("ID of the auction")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Amount of bids you would like to cancel. 1 will be removed if empty")
        ),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has('1242723431548456970')) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        let id = interaction.options.getInteger("id")
        let amount = interaction.options.getInteger("amount")
        if (!amount) amount = 1
        let selectedah = listofauctions.find(x => x.id === id)
        if (!selectedah) return await interaction.reply({ content: redtext(`Could not find auction #${id}!`), ephemeral: true })
        let bids = selectedah.bids
        let bidlength = bids.length
        for (i = bidlength - 1; i > bidlength - 1 - amount; i--) {
            bids.splice(i, 1)
            if (i === 1 || i === bidlength - amount) {
                interaction.reply({ content: greentext(`Deleted ${amount} bids from auction #${id}!`), ephemeral: true })
                selectedah.currentbid = bids[i - 1].bid
                selectedah.topbidder = bids[i - 1].user
                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4))
            }
        }

    }
}

