const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, AttachmentBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionCollector } = require('discord.js')
const { redtext, bluetext } = require('../../functions/functions.js')
const { botchannelid } = require("../../data/settings.json");
const { embedgen, biddms } = require("../../functions/ahmanager.js")

const showdetails = new ButtonBuilder()
    .setCustomId(`show`)
    .setLabel("Show Auction Details")
    .setStyle(ButtonStyle.Success)
const detailrow = new ActionRowBuilder().addComponents(showdetails)

const showhostedauction = new ButtonBuilder()
    .setCustomId("showmyauc")
    .setLabel("Show auctions I am hosting")
    .setStyle(ButtonStyle.Primary)

const showbiddedauction = new ButtonBuilder()
    .setCustomId("showbidauc")
    .setLabel("Show auctions I am bidding on")
    .setStyle(ButtonStyle.Primary)

const showmedetailrow = new ActionRowBuilder().addComponents(showhostedauction, showbiddedauction)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("me")
        .setDescription("Displays your auction stats")
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        let userdata = alluserdata.find(x => x.userid === interaction.user.id)
        const infoembed = new EmbedBuilder()
            .setTitle("Your information")
            .addFields(
                { name: "**Auctions Won**", value: `${userdata.auctionswon}`, inline:true},
                { name: "**Number Of Bids**", value: `${userdata.auctionbids}`, inline:true},
                { name: "**Total HAR Spent**", value: `${userdata.totalharspent}`, inline:true},
                { name: "**Auction Hosts**", value: `${userdata.auctionhosts}`, inline:true},
            )
            .setThumbnail(interaction.user.avatarURL())
            .setTimestamp()
            .setColor(0xadd8e6)
            .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })
        const inforeply = await interaction.reply({ embeds: [infoembed], ephemeral: true, components: [showmedetailrow] })
        const infocollect = inforeply.createMessageComponentCollector({ time: 60_000 })
        let selections = new StringSelectMenuBuilder()
            .setCustomId("option")
            .setPlaceholder("Select an option")
        infocollect.on('collect', async i => {
            const infoselected = i.customId
            i.deferUpdate()
            if (infoselected === "showmyauc") {
                //copied from getah.js
                //basic variable setup
                match = 0
                firstid = 0
                currentselection = 0
                for (i = 0; i < listofauctions.length; i++) {
                    //loop through auctions and add options to the selection string menu builder if there is a match
                    let ahcheck = listofauctions[i]
                    if (ahcheck.owner === interaction.user.id && ahcheck.active === true) {
                        match++
                        let id = ahcheck.id
                        let aucname = ahcheck.aucname
                        if(!aucname) aucname = "Name not found"
                        if (match === 1) {
                            firstid = id
                            currentselection = id
                        }
                        // if (!ahcheck.tags) tagtext = "Tags: None"
                        // else tagtext = `Tags: ${ahcheck.tags.join()}`
                        selections.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`Auction #${id}`)
                                .setDescription(`"${aucname}"`)
                                .setValue(`${id}`),
                        )
                    }
                    if (i === listofauctions.length - 1) {
                        //when it reaches the end of the data, check if there is a valid auction from the user
                        if (firstid === 0) return await interaction.editReply({ content: redtext(`There are no auctions running!`) })
                        let attachment = new AttachmentBuilder(`./images/${firstid}.png`, { name: `${firstid}.png` })
                        //turn the options we added into actionrow, include it in a message alongside show auction button
                        const row = new ActionRowBuilder()
                            .addComponents(selections)
                        const response = await interaction.editReply({ content: bluetext(`Indexed ${listofauctions.length}, found ${match} matches.`), embeds: [embedgen(firstid)], ephemeral: true, components: [row, detailrow], files: [attachment] })

                        //2 separate collectors for 2 components (string menu, and button)
                        const ahcollect = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180_000 });
                        const checkauccollect = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180_000 });

                        ahcollect.on('collect', async i => {
                            //if string menu was collected, change the embed displayed to the chosen auction
                            currentselection = +i.values[0]
                            let attachment = new AttachmentBuilder(`./images/${currentselection}.png`, { name: `${currentselection}.png` })
                            await interaction.editReply({ embeds: [embedgen(currentselection)], files: [attachment] })
                        })

                        checkauccollect.on('collect', async i => {
                            //if show detail button was collected, send user a dm with details
                            biddms(currentselection, i.user.id)
                        })
                    }
                    else continue
                }
            } else if (infoselected === "showbidauc") {
                //copied from getah.js as well
                //basic variable setup
                match = 0
                firstid = 0
                currentselection = 0
                for (i = 0; i < listofauctions.length; i++) {
                    //loop through auctions and add options to the selection string menu builder if there is a match
                    let ahcheck = listofauctions[i]
                    if (ahcheck.bids.some(u => u.user === interaction.user.id) && ahcheck.active === true) {
                        match++
                        let id = ahcheck.id
                        let aucname = ahcheck.aucname
                        if(!aucname) aucname = "Name not found"
                        if (match === 1) {
                            firstid = id
                            currentselection = id
                        }
                        // if (!ahcheck.tags) tagtext = "Tags: None"
                        // else tagtext = `Tags: ${ahcheck.tags.join()}`
                        selections.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`Auction #${id}`)
                                .setDescription(`"${aucname}"`)
                                .setValue(`${id}`),
                        )
                    }
                    if (i === listofauctions.length - 1) {
                        //when it reaches the end of the data, check if there is a valid auction from the user
                        if (firstid === 0) return await interaction.editReply({ content: redtext(`You are not bidding on any auctions!`) })
                        let attachment = new AttachmentBuilder(`./images/${firstid}.png`, { name: `${firstid}.png` })
                        //turn the options we added into actionrow, include it in a message alongside show auction button
                        const row = new ActionRowBuilder()
                            .addComponents(selections)
                        const response = await interaction.editReply({ content: bluetext(`Indexed ${listofauctions.length}, found ${match} matches.`), embeds: [embedgen(firstid)], ephemeral: true, components: [row, detailrow], files: [attachment] })

                        //2 separate collectors for 2 components (string menu, and button)
                        const ahcollect = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180_000 });
                        const checkauccollect = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180_000 });

                        ahcollect.on('collect', async i => {
                            //if string menu was collected, change the embed displayed to the chosen auction
                            currentselection = +i.values[0]
                            let attachment = new AttachmentBuilder(`./images/${currentselection}.png`, { name: `${currentselection}.png` })
                            await interaction.editReply({ embeds: [embedgen(currentselection)], files: [attachment] })
                        })

                        checkauccollect.on('collect', async i => {
                            //if show detail button was collected, send user a dm with details
                            biddms(currentselection, i.user.id)
                        })
                    }
                    else continue
                }
            }
        })
    }
}