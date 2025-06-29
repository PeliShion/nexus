const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder, ComponentType } = require('discord.js')
const { botchannelid } = require("../../data/settings.json");
const { redtext } = require('../../functions/functions.js')
module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays information and list of commands the bot has")
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true})
        activecount = 0
        allcount = listofauctions.length
        for (i = 0; i < listofauctions.length; i++) {
            //loop through the auction data to see which auctions are active
            if (listofauctions[i].active === true) activecount++
            continue
        }

        //string select menu setup
        const selection = new StringSelectMenuBuilder()
            .setCustomId("option")
            .setPlaceholder("Select an option")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("Info")
                    .setDescription("Displays information about the bot")
                    .setValue("info"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Auction commands")
                    .setDescription("List of auction commands")
                    .setValue('ahcommands'),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Moderator commands")
                    .setDescription("List of commands moderators can use")
                    .setValue("modcommands")
            )

        //loads of embed setup, nothing fancy
        const infoembed = new EmbedBuilder()
            .setTitle("Information")
            .addFields(
                { name: `**Bot up since**`, value: `<t:${boottime}:R>` },
                { name: "**Developer**", value: "<@492965189038374933>" },
                { name: "**Currently active auctions**:", value: `${activecount}` },
                { name: "**All saved auctions:**", value: `${allcount}` }
            )
            .setTimestamp()
            .setColor(0xadd8e6)
            .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

        const ahcommandembed = new EmbedBuilder()
            .setTitle("Commands")
            .addFields(
                { name: "**createah**", value: "Creates an auction" },
                { name: "**searchah**", value: "Searches auction for charms using arguments" },
                { name: "**getah**", value: "Gets auction by ID or User" },
                { name: "**bids**", value: "View the bids on the auction"},
                { name: "**lb**", value: "View leaderboards" },
                { name: "**ign**", value: "View the ign of other players"},
                { name: "**setign**", value: "Set ign of your own"},
                { name: "**deleteah**", value: "Deletes an auction if there are no bids and you are the owner" },
                { name: "**me**", value: "Look at your auction stats"}
            )
            .setTimestamp()
            .setColor(0xadd8e6)
            .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

        const modcommandembed = new EmbedBuilder()
            .setTitle("Mod commands")
            .addFields(
                { name: "**purgeah**", value: "Purges auctions that are inactive from the file" },
                { name: "**banuser**", value: "Bans user from creating or bidding on an auction" },
                { name: "**unbanuser**", value: "Unbans user who was banned" }, 
                { name: "**deleteah**", value: "Deletes an auction unconditionally" },
                { name: "**removebid**", value: "Removes bids from an auction"}
            )
            .setTimestamp()
            .setColor(0xadd8e6)
            .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

        const row = new ActionRowBuilder()
            .addComponents(selection)

        const response = await interaction.reply({ embeds: [infoembed], ephemeral: true, components: [row] })

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 120_000 });
        collector.on('collect', async i => {
            //if collected, change the displayed embed to user's choice
            i.deferUpdate()
            const selection = i.values[0]
            if (selection === "info") await interaction.editReply({ embeds: [infoembed] })
            else if (selection === "ahcommands") await interaction.editReply({ embeds: [ahcommandembed] })
            else if (selection === "modcommands") await interaction.editReply({ embeds: [modcommandembed] })
        })
    }
}
