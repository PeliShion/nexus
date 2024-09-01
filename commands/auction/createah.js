const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const fs = require("fs")
const colors = JSON.parse(fs.readFileSync("./data/colors.json"))
const { capfirstletter, redtext, greentext, miscembed } = require('../../functions/functions.js')
const { newaucchannelid, logchannelid, botchannelid } = JSON.parse(fs.readFileSync("./data/settings.json"))

module.exports = {
      data: new SlashCommandBuilder()
            .setName('createah')
            .setDescription('Create a new auction')
            .addStringOption(option =>
                  option.setName("rarity")
                        .setDescription("Rarity of the Charm")
                        .setRequired(true)
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
                        )
                        .setRequired(true)
            )
            .addIntegerOption(option =>
                  option.setName("cp")
                        .setDescription("Charm Power")
                        .addChoices(
                              { name: "1", value: 1 },
                              { name: "2", value: 2 },
                              { name: "3", value: 3 },
                              { name: "4", value: 4 },
                              { name: "5", value: 5 }
                        )
                        .setRequired(true))
            .addIntegerOption(option =>
                  option.setName("startingbid")
                        .setDescription("Starting bid in HAR")
                        .setRequired(true)
                        .setMaxValue(2000))
            .addIntegerOption(option =>
                  option.setName("increment")
                        .setDescription("Minimum increase in bid amount in HAR")
                        .setRequired(true)
                        .setMaxValue(100))
            .addStringOption(option =>
                  option.setName("length")
                        .setDescription("Length n hours or days (8h, 3d, etc.)")
                        .setRequired(true)
                        .setMaxLength(3))
            .addStringOption(option =>
                  option.setName("antisnipelength")
                        .setDescription("Legnth of antisnipe in m or h. If time is below x, reset the time to x. Set to 0m for no antisnipe")
                        .setRequired(true)
                        .setMaxLength(3))
            .addAttachmentOption(option =>
                  option.setName("image")
                        .setDescription("Image of the charm")
                        .setRequired(true))
            .addStringOption(option => (
                  option.setName("tags")
                        .setDescription("Other tags (charm effects, rolls, etc. Used for people to look up the charm). Separated using comma.")
            )),
      async execute(interaction) {
            if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true})
            //check current auciton ID
            let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
            let curaucid = settings.currentauctionid
            //turn the options collected into variables
            let rarity = interaction.options.getString("rarity")
            let startingbid = interaction.options.getInteger("startingbid")
            let increment = interaction.options.getInteger("increment")
            let tags = interaction.options.getString("tags")
            let charmclass = interaction.options.getString("class")
            let cp = interaction.options.getInteger("cp")
            let auctionlength = interaction.options.getString("length").toLowerCase()
            let antisnipelength = interaction.options.getString("antisnipelength").toLowerCase()
            let image = interaction.options.getAttachment("image").url

            let antisnipelengthins = 0
            let colorhex = colors[charmclass] //color of the embed
            let currenttime = Math.round(Date.now() / 1000)

            //turn auction length and antisnipe length into seconds to store them
            if (auctionlength.includes("h")) ahlengthinsec = +(auctionlength.replace(/[a-zA-Z]/g, "")) * 3600
            else if (auctionlength.includes("d")) ahlengthinsec = +(auctionlength.replace(/[a-zA-Z]/g, "")) * 86400
            else return await interaction.reply({ content: redtext("Please input a valid time for auction length in h or d!"), ephemeral: true })
            if (antisnipelength.includes("m")) antisnipelengthins = +(antisnipelength.replace(/[a-zA-Z]/g, "")) * 60
            else if (antisnipelength.includes("h")) antisnipelengthins = +(antisnipelength.replace(/[a-zA-Z]/g, "")) * 3600
            else return await interaction.reply({ content: redtext("Please input a valid antisnipe length in m or h! Leave it as 0m if you would not want an anitisnipe."), ephemeral: true })

            //various checks to check if the auction being created is valid or not
            if (tags && tags.length > 100) return await interaction.reply({ content: redtext("Please enter less than 100 characters for the tag!"), ephemeral: true })
            if (ahlengthinsec <= 0 || startingbid <= 0 || increment <= 0 || antisnipelengthins < 0) return await interaction.reply({ content: redtext(`Please use numbers above 0 for numbers!`), ephemeral: true })
            else if (ahlengthinsec > 604800) return await interaction.reply({ content: redtext("Auction length has to be less than 1 week!"), ephemeral: true })
            else if (antisnipelengthins > 43200) return await interaction.reply({ content: redtext(`Antisnipe length has to be less than 12 hours!`), ephemeral: true })
            let endtime = currenttime + ahlengthinsec
            if (tags === null) tagsdisplay = "None"
            else tagsdisplay = tags

            //preview embed
            let auctionembed = new EmbedBuilder()
                  .setTitle(capfirstletter(charmclass) + " Charm | Auction ID: #" + (curaucid + 1))
                  .setColor(colorhex)
                  .addFields(
                        { name: "Seller", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "Ends in:", value: `<t:${endtime}:R>`, inline: true },
                        { name: "Anti-snipe Length", value: antisnipelength, inline: true },
                        { name: "\u200B", value: "\u200B" },
                        { name: "Minimum Bid", value: `${startingbid} HAR`, inline: true },
                        { name: "Increments:", value: increment.toString() + " HAR", inline: true },
                        { name: "Tags", value: tagsdisplay, inline: true },
                  )
                  .setImage(image)
                  .setTimestamp()
                  .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

            await interaction.reply({ embeds: [auctionembed], ephemeral: true })

            if (!tags) listoftags = "None"
            else listoftags = tags.split(",")

            //send a confirmation message and create a collector for the button attached
            const response = await interaction.followUp({ content: `__Rarity: ${rarity}, class: ${charmclass}, charm power: ${cp}__\nAre you sure you want to create this auction? It cannot be edited once it is made!`, ephemeral: true, components: [confirmrow] })
            const confirmed = await response.createMessageComponentCollector({ time: 60_000 })

            confirmed.on('collect', async i => {
                  const selection = i.customId
                  if (selection === "confirm") {
                        //if collected confirm, increase the auciton id, save it, send the embed to new-auctions channel, and push the data to auctions.json
                        curaucid++
                        settings.currentauctionid = curaucid
                        let auctionembedsend = new EmbedBuilder()
                              .setTitle(capfirstletter(charmclass) + " Charm | Auction ID: #" + curaucid)
                              .setColor(colorhex)
                              .addFields(
                                    { name: "Seller", value: `<@${interaction.user.id}>`, inline: true },
                                    { name: "Ends in:", value: `<t:${endtime}:R>`, inline: true },
                                    { name: "Anti-snipe Length", value: antisnipelength, inline: true },
                                    { name: "\u200B", value: "\u200B" },
                                    { name: "Minimum Bid", value: `${startingbid} HAR`, inline: true },
                                    { name: "Increments:", value: increment.toString() + " HAR", inline: true },
                                    { name: "Tags", value: tagsdisplay, inline: true },
                              )
                              .setImage(image)
                              .setTimestamp()
                              .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

                        let auctionobject = {
                              "id": curaucid,
                              "owner": interaction.user.id,
                              "active": true,
                              "cp": cp,
                              "class": charmclass,
                              "minbid": startingbid,
                              "increment": increment,
                              "rarity": rarity,
                              "starttime": currenttime,
                              "endtime": endtime,
                              "antisnipe": antisnipelengthins,
                              "antisnipestring": antisnipelength,
                              "topbidder": 0,
                              "bids": [
                                    {
                                          "user": 0,
                                          "bid": 0
                                    }
                              ],
                              "prebids": [
                                    {
                                          "user": 0,
                                          "amount": 0
                                    }
                              ],
                              "currentbid": 0,
                              "notification": [interaction.user.id],
                              "tags": tags?.toLowerCase().split(","),
                              "image": image
                        }
                        listofauctions.push(auctionobject)
                        const showdetails = new ButtonBuilder()
                              .setCustomId(`${curaucid}`)
                              .setLabel("Show Auction Details")
                              .setStyle(ButtonStyle.Success)
                        const detailrow = new ActionRowBuilder().addComponents(showdetails)
                        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
                        fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4))

                        await client.channels.fetch(newaucchannelid).then(channel => channel.send({ embeds: [auctionembedsend], components: [detailrow] }))
                        await i.update({ content: greentext("Auction Created! ID: " + (curaucid)), components: [], ephemeral: true })
                        let auccreatelog = miscembed()
                              .setTitle(`New auction (ID #${curaucid})`)
                              .setDescription(`Owner: <@${interaction.user.id}>`)
                              .setColor(0xffff00)
                        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [auccreatelog] }))
                  }
            })
      }
}