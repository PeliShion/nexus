const { AttachmentBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js')
const { redtext, bluetext, genmessagelink } = require('../../functions/functions.js')
const { embedgen, biddms } = require('../../functions/ahmanager.js')
const { botchannelid } = require("../../data/settings.json");

const showdetails = new ButtonBuilder()
    .setCustomId(`show`)
    .setLabel("Show Auction Details")
    .setStyle(ButtonStyle.Success)
const detailrow = new ActionRowBuilder().addComponents(showdetails)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("searchah")
        .setDescription("Search The Auction")
        .addStringOption(option =>
            option.setName("rarity")
                .setDescription("Rarity of the Charm")
                .addChoices(
                    { name: "Common", value: "common" },
                    { name: "Uncommon", value: "uncommon" },
                    { name: "Rare", value: "rare" },
                    { name: "Epic", value: "epic" },
                    { name: "Legendary", value: "legendary" }
                ))
        .addStringOption(option =>
            option.setName("class")
                .setDescription("The Charm's class")
                .addChoices(
                    { name: "Dawnbringer", value: "dawn" },
                    { name: "Earthbound", value: "earth" },
                    { name: "Flamecaller", value: "flame" },
                    { name: "Frostborn", value: "frost" },
                    { name: "Steelsage", value: "steel" },
                    { name: "Shadowdancer", value: "shadow" },
                    { name: "Windwalker", value: "wind" },
                    { name: "Multiclass", value: "multi" }
                ))
        .addIntegerOption(option =>
            option.setName("cp")
                .setDescription("Charm Power")
                .addChoices(
                    { name: "1", value: 1 },
                    { name: "2", value: 2 },
                    { name: "3", value: 3 },
                    { name: "4", value: 4 },
                    { name: "5", value: 5 }
                ))
        .addStringOption(option =>
            option.setName("tags")
                .setDescription("Tags For The Charm, Separated Using Commas To Search For Multiple Tags")
        )
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true})
        //turn collected arguments into variables
        let rarity = interaction.options?.getString("rarity")
        let tags = interaction.options.getString("tags")?.toLowerCase().replace(/\s/g, '').split(",")
        let cp = interaction.options?.getInteger("cp")
        let charmclass = interaction.options?.getString("class")
        let match = 0
        let firstid = 0
        let currentselection = 0

        //set up string menu for later
        let selections = new StringSelectMenuBuilder()
            .setCustomId("option")
            .setPlaceholder("Select an option")

        //check if none of the variables are collected
        if (!rarity && !cp && !tags && !charmclass) return await interaction.reply({ content: redtext("You need to enter at least 1 argument to search for charms!"), ephemeral: true })
        await interaction.reply({ content: bluetext("Searching..."), ephemeral: true })//sending this so it can be editreplyed later
        
        for (let i = 0; i < listofauctions.length; i++) {
            let ahcheck = listofauctions[i]
            //loop through the auctions and add options to string menu on match
            let numberoftagsmatching = ahcheck.tags?.filter(value => tags?.includes(value.replace(/\s/g, '')).length === tags?.replace(/\s/g, '').length)
            if ((ahcheck.rarity === rarity || rarity == null) && (ahcheck.cp === cp || cp == null) && (ahcheck.class === charmclass || charmclass == null) && (numberoftagsmatching || tags == null) && ahcheck.active === true) {
                match++
                let id = ahcheck.id
                if (match === 1) {
                    //checks for the first match to display first before the user picks anything
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
                //at the end of auction data, check if there were no valid auctions at all
                if (firstid === 0) return await interaction.editReply({ content: redtext(`No auctions found with the criteria!`) })
                let attachment = new AttachmentBuilder(`./images/${firstid}.png`, {name: `${firstid}.png`})
                //create an action row with the string menu options we added earlier
                const row = new ActionRowBuilder()
                    .addComponents(selections)

                const response = await interaction.editReply({ content: bluetext(`Indexed ${listofauctions.length}, found ${match} matches.`), embeds: [embedgen(firstid)], ephemeral: true, components: [row, detailrow], files:[attachment] })
                //2 component collectors for string menu and button
                const ahcollect = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180_000 });
                const checkauccollect = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180_000 });

                ahcollect.on('collect', async i => {
                    //if string menu was collected, change the embed to what the user has picked
                    i.deferUpdate()
                    currentselection = +i.values[0]
                    let attachment = new AttachmentBuilder(`./images/${currentselection}.png`, {name: `${currentselection}.png`})
                    await interaction.editReply({ content: genmessagelink(id), embeds: [embedgen(currentselection)], files:[attachment] })
                })

                checkauccollect.on('collect', async i => {
                    //if show auction details button was collected, send them a dm with auction details
                    i.deferUpdate()
                    biddms(currentselection, i.user.id)
                })
            }
            else continue
        }
    }
}
