const { SlashCommandBuilder } = require('discord.js')
const { redtext, greentext, miscembed } = require('../../functions/functions.js')
const fs = require('fs')
const { modroleid, logchannelid } = require("../../data/settings.json");

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
        )
        .addBooleanOption(option =>
            option.setName("autobid")
                .setDescription("Remove autobid? Setting this to true will only remove the autobid")
        ),

    async execute(interaction) {
        //check if the user running the command has permission to remove bids
        //if it is not the owner of the bot (Peli) and does not have moderator role, send them an error message
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has(modroleid)) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })

        //turn collected variables into arguments
        let id = interaction.options.getInteger("id")
        let amount = interaction.options.getInteger("amount")
        let prebid = interaction.options.getBoolean("autobid")
        if (!amount) amount = 1
        let selectedah = listofauctions.find(x => x.id === id)
        if (!selectedah) return await interaction.reply({ content: redtext(`Could not find auction #${id}!`), ephemeral: true })

        if (prebid === true) {
            selectedah.prebids[0].amount = 0
            selectedah.prebids[0].user = 0
            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4))
            let removebidlog = miscembed()
                .setTitle(`Removed autobid from auction #${id}`)
                .setDescription(`Removed by <@${interaction.user.id}>`)
                .setColor(0xff0000)
            await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [removebidlog] }))
            return await interaction.reply({ content: greentext(`Removed the autobid from auction #${id}`), ephemeral:true })
        }
        let bids = selectedah.bids
        let bidlength = bids.length
        for (i = bidlength - 1; i > bidlength - 1 - amount; i--) {
            //splice the bids for selected amounts, and update the current bid and top bidder 
            bids.splice(i, 1)
            if (i === 1 || i === bidlength - amount) {
                interaction.reply({ content: greentext(`Deleted ${amount} bids from auction #${id}!`), ephemeral: true })
                let removebidlog = miscembed()
                    .setTitle(`Removed ${amount} bids from ${id}`)
                    .setDescription(`Removed by <@${interaction.user.id}>`)
                    .setColor(0xff0000)
                await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [removebidlog] }))
                selectedah.currentbid = bids[i - 1].bid
                selectedah.topbidder = bids[i - 1].user
                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4))
            }
        }

    }
}

