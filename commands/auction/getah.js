const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder, AttachmentBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js')
const { redtext, bluetext } = require('../../functions/functions.js')
const { embedgen, biddms } = require("../../functions/ahmanager.js")
const { botchannelid } = require("../../data/settings.json");

const showdetails = new ButtonBuilder()
    .setCustomId(`show`)
    .setLabel("Show Auction Details")
    .setStyle(ButtonStyle.Success)
const detailrow = new ActionRowBuilder().addComponents(showdetails)

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
        )
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true})
        await interaction.reply({ content: bluetext("Searching..."), ephemeral: true })//sending this first so it can be editreplyed later
        //getting arguments from command
        let id = interaction.options?.getInteger("id")
        let user = interaction.options?.getUser("user")

        if (!id && !user) return await interaction.editReply({ content: redtext("Please input ID or user you would like to search for!"), ephemeral: true })
        let selections = new StringSelectMenuBuilder()
            .setCustomId("option")
            .setPlaceholder("Select an option")

        if (id) {
            //if id was inputted, search the auction for the specific id and display the data + bid buttons
            let selectedah = listofauctions.find(x => x.id === id)
            if (!selectedah) return await interaction.editReply({ content: redtext("Could not find an auction with ID " + id + "!"), ephemeral: true })
            let attachment = new AttachmentBuilder(`./images/${id}.png`, {name: `${id}.png`})
            const response = await interaction.editReply({ content: "", embeds: [embedgen(id)], components: [detailrow], ephemeral: true, files:[attachment] })
            const collector = response.createMessageComponentCollector({ time: 60_000 })
                //create a collector and send them to dms
            collector.on('collect', async i => {
                i.deferUpdate()
                collector.stop()
                biddms(id, i.user.id)
            })
            
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
                    if (!ahcheck.tags) tagtext = "Tags: None"
                    else tagtext = `Tags: ${ahcheck.tags.join()}`
                    selections.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`Auction #${id}`)
                            .setDescription(tagtext)
                            .setValue(`${id}`),
                    )
                }
                if (i === listofauctions.length - 1) {
                    //when it reaches the end of the data, check if there is a valid auction from the user
                    if (firstid === 0) return await interaction.editReply({ content: redtext(`There are no auctions from that user!`) })
                    let attachment = new AttachmentBuilder(`./images/${firstid}.png`, {name: `${firstid}.png`})
                    //turn the options we added into actionrow, include it in a message alongside show auction button
                    const row = new ActionRowBuilder()
                        .addComponents(selections)
                    const response = await interaction.editReply({ content: bluetext(`Indexed ${listofauctions.length}, found ${match} matches.`), embeds: [embedgen(firstid)], ephemeral: true, components: [row, detailrow], files:[attachment] })

                    //2 separate collectors for 2 components (string menu, and button)
                    const ahcollect = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180_000 });
                    const checkauccollect = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180_000 });

                    ahcollect.on('collect', async i => {
                        //if string menu was collected, change the embed displayed to the chosen auction
                        i.deferUpdate()
                        currentselection = +i.values[0]
                        let attachment = new AttachmentBuilder(`./images/${currentselection}.png`, {name: `${currentselection}.png`})
                        await interaction.editReply({ embeds: [embedgen(currentselection)], files:[attachment] })
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