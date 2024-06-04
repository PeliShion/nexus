const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js')
const { redtext, bluetext } = require('../../data/functions.js')
const { bidmin, bidcustom, embedgen, biddms } = require("../../data/ahmanager.js")

const showdetails = new ButtonBuilder()
    .setCustomId(`show`)
    .setLabel("Show Auction Details")
    .setStyle(ButtonStyle.Success)
const detailrow = new ActionRowBuilder().addComponents(showdetails)

const bidcustomamount = new ButtonBuilder()
    .setCustomId('customamount')
    .setLabel('Bid Custom Amount')
    .setStyle(ButtonStyle.Primary);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("getah")
        .setDescription("Finds auction based on the ID/User. ID takes priority when both are inputted")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("ID of the auction")
        )
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User you would like to search")
        ),

    async execute(interaction) {
        await interaction.reply({ content: bluetext("Searching..."), ephemeral: true })//sending this first so it can be editreplyed later
        //getting arguments from command
        let id = interaction.options?.getInteger("id")
        let user = interaction.options?.getUser("user")

        if (!id && !user) return await interaction.editReply({ content: redtext("Please input ID or user you would like to search for!"), ephemeral: true })
        let authorid = interaction.user.id

        const bidcustomdisabled = new ButtonBuilder()
            .setCustomId('custom')
            .setLabel("Bid Custom Amount")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)

        let selections = new StringSelectMenuBuilder()
            .setCustomId("option")
            .setPlaceholder("Select an option")

        if (id) {
            //if id was inputted, search the auction for the specific id and display the data + bid buttons
            let selectedah = listofauctions.find(x => x.id === id)
            if (!selectedah) return await interaction.editReply({ content: redtext("Could not find an auction with ID " + id + "!"), ephemeral: true })
            //turn needed data into arguments
            let currentbid = selectedah.currentbid
            let minbid = selectedah.minbid
            let increment = selectedah.increment
            let active = selectedah.active

            //check if there is a bid, if there is next bid = current bid + increment, if not minimum bid
            if (currentbid < minbid) nextbid = minbid
            else nextbid = currentbid + increment

            let bidminamount = new ButtonBuilder()
                .setCustomId('minamount')
                .setLabel(`Bid ${nextbid} HAR`)
                .setStyle(ButtonStyle.Primary);

            //check if the auction is active. if not, the buttons are greyed out
            if (active === false) ahembedrow = new ActionRowBuilder().addComponents(bidminamount.setDisabled(true), bidcustomdisabled)
            else ahembedrow = new ActionRowBuilder().addComponents(bidminamount, bidcustomamount)

            const response = await interaction.editReply({ content: "", embeds: [embedgen(id)], components: [ahembedrow], ephemeral: true })
            if (active === true) {
                const collector = response.createMessageComponentCollector({ time: 60_000 })
                //if the auction is active, create a collector and run whichever the user has decided to do
                collector.on('collect', async i => {
                    i.deferUpdate()
                    const selection = i.customId

                    if (selection === "minamount") {
                        bidmin(id, interaction, authorid, false)
                        collector.stop()
                    }

                    else if (selection === "customamount") {
                        bidcustom(id, interaction, authorid, false)
                        collector.stop()
                    }
                })
            }
        }

        else {
            //basic variable setup
            match = 0
            firstid = 0
            currentselection = 0
            for (i = 0; i < listofauctions.length; i++) {
                //loop through auctions and add options to the selection string menu builder if there is a match
                let ahcheck = listofauctions[i]
                if (ahcheck.owner === user.id) {
                    match++
                    let id = ahcheck.id
                    if (match === 1) {
                        firstid = id
                        currentselection = id
                    }
                    selections.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`Auction #${id}`)
                            .setDescription(`View auction #${id}`)
                            .setValue(`${id}`),
                    )
                }
                if (i === listofauctions.length - 1) {
                    //when it reaches the end of the data, check if there is a valid auction from the user
                    if (firstid === 0) return await interaction.editReply({ content: redtext(`There are no auctions from <@${user}>!`) })
                    
                    //turn the options we added into actionrow, include it in a message alongside show auction button
                    const row = new ActionRowBuilder()
                        .addComponents(selections)
                    const response = await interaction.editReply({ content: bluetext(`Indexed ${listofauctions.length}, found ${match} matches.`), embeds: [embedgen(firstid)], ephemeral: true, components: [row, detailrow] })
                    
                    //2 separate collectors for 2 components (string menu, and button)
                    const ahcollect = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180_000 });
                    const checkauccollect = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180_000 });

                    ahcollect.on('collect', async i => {
                        //if string menu was collected, change the embed displayed to the chosen auction
                        i.deferUpdate()
                        currentselection = +i.values[0]
                        await interaction.editReply({ embeds: [embedgen(currentselection)] })
                    })

                    checkauccollect.on('collect', async i => {
                        //if show detail button was collected, send user a dm with details
                        i.deferUpdate()
                        biddms(currentselection, i.user.id)
                    })
                }
                else continue
            }
        }
    }
}