const { SlashCommandBuilder } = require('discord.js')
const { botchannelid } = require("../../data/settings.json");
const { redtext } = require('../../functions/functions.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("repost")
        .setDescription("Reposts all old auctions chronologically")
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true})
        else if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has(modroleid)) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        let i = 0;
        let sendEmbeds = setInterval(() => {
            let selectedah = listofauctions[i]
            let currentbid = selectedah.currentbid
            let increment = selectedah.increment
            let currenttopbidder = selectedah.topbidder
            let owner = selectedah.owner
            let endtime = selectedah.endtime
            let antisnipestring = selectedah.antisnipestring
            let charmclass = selectedah.class
            let anonymity = selectedah.anonymity
            let ownerun = selectedah.ownerun
            if(!ownerun) ownertext = " "
            else ownertext = `\`${ownerun}\``
            let colorhex = colors[charmclass]
            let aucname = selectedah.aucname
            let rarity = selectedah.rarity

            //if the auction has ended, ends in text displays ended
            if (Math.round(Date.now() / 1000) > endtime) endtext = "__Ended__"
            else endtext = `<t:${endtime}:R>`

            //if there are no bidders, current top bidder becomes none
            if (currenttopbidder === 0) topbiddertext = "None"
            else if (anonymity === true) topbiddertext = `${currentbid} HAR Anonymous`
            else topbiddertext = `${currentbid} HAR <@${currenttopbidder}>`

            let attachment = new AttachmentBuilder(`./images/${id}.png`, { name: `${id}.png` })
            let auctionembed = new EmbedBuilder()
                .setTitle(aucname + " | ID: #" + id)
                .setColor(colorhex)
                .addFields(
                    { name: "Seller", value: `<@${owner}> ${ownertext}`, inline: true },
                    { name: "Ends", value: endtext, inline: true },
                    { name: "Anti-snipe Length", value: antisnipestring, inline: true },
                    { name: "\u200B", value: "\u200B" },
                    { name: "Current Bid", value: topbiddertext, inline: true },
                    { name: "Increment", value: increment.toString() + " HAR", inline: true },
                    { name: "Rarity | Class", value: `${rarity} | ${charmclass}`, inline: true },
                )
                .setImage(`attachment://${attachment.name}`)
                .setTimestamp()
                .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })
            interaction.channel.send({ embeds: [auctionembed], files: attachment} )
            i++;
            if(i === listofauctions.length - 1) clearInterval(sendEmbeds);
        }, 500);
    }
}
