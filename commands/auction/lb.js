const { SlashCommandBuilder } = require('discord.js')
const { redtext } = require('../../functions/functions.js')
const { botchannelid } = require("../../data/settings.json");

module.exports = {
    data: new SlashCommandBuilder()
          .setName("lb")
          .setDescription("View leaderboards of certain statistics")
          .setDMPermission(false)
          .addStringOption(option =>
            option.setName("stats")
            .setDescription("The Current Rarity of The Charm")
            .setRequired(true)
            .addChoices(
                { name: "Auctions Won", value: "won" },
                { name: "Number of Bids", value: "bids" },
                { name: "Auctions Created", value: "created" },
                { name: "HAR spent", value: "spent" },
            )),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        let chosenlb = interaction.options.getString("stats")
        let searchkey;
        if(chosenlb === "spent") searchkey = "totalharspent"
        else if(chosenlb === "created") searchkey = "auctionhosts"
        else if(chosenlb === "bids") searchkey = "auctionbids"
        else searchkey = "auctionswon"
    }
}