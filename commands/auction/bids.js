const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const { redtext, bluetext } = require("../../functions/functions.js")
const { botchannelid } = require("../../data/settings.json");

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
        )
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        const bidmenu = await interaction.reply({ content: bluetext("Searching..."), ephemeral: true }) //sending this first so it can be editreplied later
        let id = interaction.options.getInteger("id") //collecting the argument from command  
        let selectedah = listofauctions.find(x => x.id === id) //search through the auction and find the one with same id
        if (!selectedah) return await interaction.editReply({ content: redtext("Could not find an auction with ID " + id + "!"), ephemeral: true })
        let anonymity = selectedah.anonymity
        let bidarray = selectedah.bids
        let bidlength = bidarray.length
        //there is a default null bid as a placeholder hence why it checks if it is lower than 2
        if (bidlength < 2) return await interaction.editReply({ content: redtext(`There are no bids on this auction!`), ephemeral: true })
        let page = 0


        //setting up base embed
        let bidsembed = new EmbedBuilder()
            .setTitle(`Bids for auction #${id}`)
            .setDescription(`Page ${page + 1}`)
            .setColor(0xd4af37)
            .setTimestamp()
            .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

        //for the first page, loop the bids array object and add fields to bidsembed
        for (i = bidlength - 1; i > bidlength - 6; i--) {
            biduser = ""
            if (anonymity === true) biduser = "Anonymous"
            else biduser = `<@${bidarray[i].user}>`
            bidsembed.addFields({ name: `Bid #${i}`, value: `${bidarray[i].bid} HAR by ${biduser}` })
            if (i === 1 || i === bidlength - 5) {
                interaction.editReply({ content: bluetext(`Found ${bidlength - 1} bids`), embeds: [bidsembed], components: [arrowrow] })
                break;
            }
        }

        const arrowcollector = await bidmenu.createMessageComponentCollector({ time: 600_000 }) //creation of the collector of left/right arrow buttons
        arrowcollector.on('collect', async i => {
            let selection = i.customId
            i.deferUpdate()
            if (selection === "left") {
                if (page === 0) return
                else {
                    //if page is not 0 (or 1, the first page), decrease page count, remove all the fields from the embed and repeat what was done above
                    page--
                    bidsembed.spliceFields(0, 5)
                    bidsembed.setDescription(`Page ${page + 1}`)
                    for (i = bidlength - 1 - (page * 5); i > bidlength - 6 - (page * 5); i--) {
                        if (anonymity === true) biduser = "Anonymous"
                        else biduser = `<@${bidarray[i].user}>`
                        bidsembed.addFields({ name: `Bid #${i}`, value: `${bidarray[i].bid} HAR by ${biduser}` })
                        if (i === 1 || i === bidlength - (page * 5 + 5)) {
                            interaction.editReply({ embeds: [bidsembed], components: [arrowrow] })
                            break;
                        }
                    }
                }
            } else {
                //check if there are valid bids in the next page, if not return
                //if else, increase the page count, remove all the fields from the embed and repeat what was done above
                if (bidarray[bidlength - 1 - ((page + 1) * 5)] === undefined) return
                page++
                bidsembed.spliceFields(0, 5)
                bidsembed.setDescription(`Page ${page + 1}`)
                for (i = bidlength - 1 - (page * 5); i > bidlength - 6 - (page * 5); i--) {
                    if (anonymity === true) biduser = "Anonymous"
                    else biduser = `<@${bidarray[i].user}>`
                    bidsembed.addFields({ name: `Bid #${i}`, value: `${bidarray[i].bid} HAR by ${biduser}` })
                    if (i === 1 || i === bidlength - (page * 5 + 5)) {
                        interaction.editReply({ embeds: [bidsembed], components: [arrowrow] })
                        break;
                    }
                }

            }
        })
    }
}