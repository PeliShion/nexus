const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const { redtext, bluetext } = require("../../data/functions.js")

const leftarrow = new ButtonBuilder()
    .setCustomId("left")
    .setLabel("⬅️")
    .setStyle(ButtonStyle.Success);

const rightarrow = new ButtonBuilder()
    .setCustomId('right')
    .setLabel("➡️")
    .setStyle(ButtonStyle.Success)

const arrowrow = new ActionRowBuilder().addComponents(leftarrow, rightarrow)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bids")
        .setDescription("Check the bid history of an auction")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("ID of the auction you want to check")
                .setRequired(true)
        ),

    async execute(interaction) {

        const bidmenu = await interaction.reply({ content: bluetext("Searching..."), ephemeral: true })
        let id = interaction.options.getInteger("id")
        let selectedah = listofauctions.find(x => x.id === id)
        if (!selectedah) return await interaction.editReply({ content: redtext("Could not find an auction with ID " + id + "!"), ephemeral: true })
        let bidarray = selectedah.bids
        let bidlength = bidarray.length
        if (bidlength < 2) return await interaction.editReply({ content: redtext(`There are no bids on this auction!`), ephemeral: true })
        let page = 0
     
        let bidsembed = new EmbedBuilder()
            .setTitle(`Bids for auction #${id}`)
            .setDescription(`Page ${page + 1}`)
            .setColor(0xd4af37)
            .setTimestamp()
            .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })
        for (i = bidlength - 1; i > bidlength - 6; i--) {
            bidsembed.addFields({ name: `Bid #${i}`, value: `${bidarray[i].bid} HAR by <@${bidarray[i].user}>` })
            if (i === 1 || i === bidlength - 5) {
                interaction.editReply({ content: bluetext(`Found ${bidlength - 1} bids`), embeds: [bidsembed], components: [arrowrow] })
                break;
            }
        }
        const arrowcollector = await bidmenu.createMessageComponentCollector({ time: 60_000 })
        arrowcollector.on('collect', async i => {
            let selection = i.customId
            i.deferUpdate()
            if (selection === "left") {
                if (page === 0) return 
                else {
                page--
                bidsembed.spliceFields(0, 5)
                bidsembed.setDescription(`Page ${page + 1}`)
                for (i = bidlength - 1 - (page * 5); i > bidlength - 6 - (page * 5); i--) {
                    bidsembed.addFields({ name: `Bid #${i}`, value: `${bidarray[i].bid} HAR by <@${bidarray[i].user}>` })
                    if (i === 1 || i === bidlength - (page * 5 + 5)) {
                        interaction.editReply({ embeds: [bidsembed], components: [arrowrow] })
                        break;
                    }
                }
                }
            } else {
                if(bidarray[bidlength - 1 - ((page + 1) * 5)] === undefined) return
                page++
                bidsembed.spliceFields(0, 5)
                bidsembed.setDescription(`Page ${page + 1}`)
                for (i = bidlength - 1 - (page * 5); i > bidlength - 6 - (page * 5); i--) {
                    bidsembed.addFields({ name: `Bid #${i}`, value: `${bidarray[i].bid} HAR by <@${bidarray[i].user}>` })
                    if (i === 1 || i === bidlength - (page * 5 + 5)) {
                        interaction.editReply({ embeds: [bidsembed], components: [arrowrow] })
                        break;
                    }
                }

            }
        })
    }
}