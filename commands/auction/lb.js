const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
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
        let chosenLb = interaction.options.getString("stats")
        let searchKey;
        let unit;
        let title;
        if (chosenLb === "spent") searchKey = "totalharspent", unit = "HAR", title = "Total HAR Spent on Auctions"
        else if (chosenLb === "created") searchKey = "auctionhosts", unit = "Auctions", title = "Number of Auction Created"
        else if (chosenLb === "bids") searchKey = "auctionbids", unit = "Bids", title = "Total Number of Bids"
        else searchKey = "auctionswon", unit = "Auctions", title = "Number of Auctions Won"

        function generateLb(data, key, userId, top) {
            // Sort and filter valid entries
            const sorted = [...data]
                .filter(user => typeof user[key] === 'number')
                .sort((a, b) => b[key] - a[key]);

            const userIndex = sorted.findIndex(u => u.userid === userId);
            const userRank = userIndex + 1;
            const userData = sorted[userIndex];
            const userScore = userData?.[key] ?? 0;

            // Build top x list
            const topList = sorted
                .slice(0, top)
                .map((user, index) => {
                    return `**#${index + 1}** <@${user.userid}> — \`${user[key]}\` ${unit}`;
                })
                .join('\n');

            // If user isn't in top x, add their rank
            const userLine = (userIndex >= top) ? `\n...\n**#${userRank}** <@${userId}> — \`${userScore}\` ${unit}` : '';

            const embed = new EmbedBuilder()
                .setTitle("Leaderboard for " + title)
                .setDescription(topList + userLine)
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

            return embed;
        }

        interaction.reply({ embeds: [generateLb(alluserdata, searchKey, interaction.user.id, 10)], ephemeral: true})
    }
}