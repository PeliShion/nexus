const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const fs = require("fs")
const fetch = require('node-fetch')
const mergeImg = require('merge-img')
const colors = JSON.parse(fs.readFileSync("./data/colors.json"))
const { capfirstletter, redtext, greentext, miscembed } = require('../../functions/functions.js')
const { newaucchannelid, logchannelid, botchannelid } = JSON.parse(fs.readFileSync("./data/settings.json"))

module.exports = {
      data: new SlashCommandBuilder()
            .setName('qc')
            .setDescription('Create an auction with settings you have configured')
            .setDMPermission(false)
            .addStringOption(option =>
                  option.setName("rarity")
                        .setDescription("The Current Rarity of The Charm")
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
            .addAttachmentOption(option =>
                  option.setName("image")
                        .setDescription("Image of the charm")
                        .setRequired(true))
            .addAttachmentOption(option =>
                  option.setName('image2')
                        .setDescription('Additional image for upgrades etc. This image will be on the right of first image')
            ),
      async execute(interaction) {
            interaction.deferReply({ ephemeral: true })
            if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
            //check current auciton ID
            let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
            let userdata = alluserdata.find(x => x.userid === interaction.user.id)
            let curaucid = settings.currentauctionid
            let tempid = curaucid + 1
            //turn the options collected into variables
            let rarity = interaction.options.getString("rarity")
            let charmclass = interaction.options.getString("class")
            let cp = interaction.options.getInteger("cp")

            let antisnipe = userdata.qc.antisnipe
            let antisnipelengthins = antisnipe * 3600
            let antisnipelength = antisnipe + "h"
            
            let startingbid = userdata.qc.startingbid
            let increment = userdata.qc.increment
            let length = userdata.qc.length

            let imagelink = interaction.options.getAttachment("image").url
            let image2link = interaction.options.getAttachment('image2')
            let tempfilename = `${interaction.user.id + (tempid)}`
            if (image2link) {
                  let img = await mergeImg([imagelink, image2link.url])
                  await img.write(`./tempimg/${tempfilename}.png`)
                  await new Promise(r => setTimeout(r, 2000));
            } else {
                  await fetch(imagelink).then(res => {
                        res.body.pipe(fs.createWriteStream(`./tempimg/${tempfilename}.png`))
                  })
                  await new Promise(r => setTimeout(r, 2000))
            }

            let colorhex = colors[charmclass] //color of the embed
            let currenttime = Math.round(Date.now() / 1000)
            let endtime = currenttime + length
            let aucname = `${capfirstletter(charmclass)} Charm`
            let tempattachment = new AttachmentBuilder(`./tempimg/${tempfilename}.png`, { name: `${tempfilename}.png` })
            //preview embed
            let auctionembed = new EmbedBuilder()
                  .setTitle(aucname + " | ID: #" + (tempid))
                  .setColor(colorhex)
                  .addFields(
                        { name: "Seller", value: `<@${interaction.user.id}> \`${interaction.user.username}\``, inline: true },
                        { name: "Ends:", value: `<t:${endtime}:R>`, inline: true },
                        { name: "Anti-snipe Length", value: antisnipelength, inline: true },
                        { name: "\u200B", value: "\u200B" },
                        { name: "Minimum Bid", value: `${startingbid} HAR`, inline: true },
                        { name: "Increments:", value: increment.toString() + " HAR", inline: true },
                        { name: "Rarity | Class", value: `${rarity} | ${charmclass}`, inline: true },
                  )
                  .setImage(`attachment://${tempattachment.name}`)
                  .setTimestamp()
                  .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

            await interaction.editReply({ embeds: [auctionembed], ephemeral: true, files: [tempattachment] })

            //send a confirmation message and create a collector for the button attached
            const response = await interaction.followUp({ content: `__Rarity: ${rarity}, class: ${charmclass}, charm power: ${cp}__\nAre you sure you want to create this auction? It cannot be edited once it is made!`, ephemeral: true, components: [confirmrow] })
            const confirmed = await response.createMessageComponentCollector({ time: 600_000 })

            confirmed.on('collect', async i => {
                  const selection = i.customId
                  if (selection === "confirm") {
                        //if collected confirm, increase the auciton id, save it, send the embed to new-auctions channel, and push the data to auctions.json
                        if(settings.currentauctionid >= tempid) curaucid = settings.currentauctionid
                        curaucid++
                        msgid = 0
                        settings.currentauctionid = curaucid
                        userdata.auctionhosts++
                        const showdetails = new ButtonBuilder()
                              .setCustomId(`${curaucid}`)
                              .setLabel("Show Auction Details")
                              .setStyle(ButtonStyle.Success)
                        const detailrow = new ActionRowBuilder().addComponents(showdetails)
                        let auctionembedsend = new EmbedBuilder()
                              .setTitle(aucname + " | ID: #" + (curaucid))
                              .setColor(colorhex)
                              .addFields(
                                    { name: "Seller", value: `<@${interaction.user.id}> \`${interaction.user.username}\``, inline: true },
                                    { name: "Ends", value: `<t:${endtime}:R>`, inline: true },
                                    { name: "Anti-snipe Length", value: antisnipelength, inline: true },
                                    { name: "\u200B", value: "\u200B" },
                                    { name: "Minimum Bid", value: `${startingbid} HAR`, inline: true },
                                    { name: "Increments", value: increment.toString() + " HAR", inline: true },
                                    { name: "Rarity | Class", value: `${rarity} | ${charmclass}`, inline: true },
                              )
                              .setImage(`attachment://${tempattachment.name}`)
                              .setTimestamp()
                              .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

                        let newaucchannel = await client.channels.fetch(newaucchannelid)
                        await newaucchannel.send({ embeds: [auctionembedsend], files: [tempattachment], components: [detailrow] }).then((message) => msgid = message.id)

                        let auctionobject = {
                              "id": curaucid,
                              "owner": interaction.user.id,
                              "ownerun": interaction.user.username,
                              "aucname": aucname,
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
                              "anonymity": false,
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
                              "blocknotif": ["0", interaction.user.id],
                              "tags": "None",
                              "msgid": msgid
                        }
                        listofauctions.push(auctionobject)
                        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
                        fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4))
                        fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
                        fs.renameSync(`./tempimg/${tempfilename}.png`, `./images/${curaucid}.png`)
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