const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { redtext, greentext, miscembed } = require("../../functions/functions.js")
const { modroleid, logchannelid, botchannelid } = require("../../data/settings.json");


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
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true})
        let selectedid = interaction.options.getInteger("id") //collecting argument from the command
        let selectedah = listofauctions.find(x => x.id === selectedid) //search through the auction data
        if (!selectedah) return await interaction.reply({ content: redtext("Could not find an auction with ID " + selectedid + "!"), ephemeral: true })
        let ahowner = selectedah.owner
        //check if the user running the command is valid to delete the auction.
        //if it is not the bot owner (Peli) and does not have mod role, and if the auction's owner is not the user running or it has a bid
        if ((interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has(modroleid)) && (interaction.user.id !== ahowner || selectedah.currentbid !== 0)) return await interaction.reply({ content: redtext("You need to be a moderator or the owner of the auction which has 0 bids to use this command!"), ephemeral: true })
        else for (i = 0; i < listofauctions.length; i++) {
            //if the user is allowed to delete, find the auction and splice out the data
            if (listofauctions[i].id === selectedid) {
                listofauctions.splice(i, 1)
                break
            } else continue
        }
        interaction.reply({ content: greentext("Deleted auction #" + selectedid + "!"), ephemeral: true })
        let deleteauclog = miscembed()
            .setTitle(`Auction #${selectedid} deleted`)
            .setDescription(`Deleted by <@${interaction.user.id}>`)
            .setColor(0xff0000)
        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [deleteauclog] }))
        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4))
    }
}