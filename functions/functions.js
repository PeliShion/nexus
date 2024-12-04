const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

module.exports.capfirstletter = function (string) {
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
}

module.exports.redtext = function (string) {
    return "```diff\n-" + string + "\n```";
}

module.exports.greentext = function (string) {
    return "```diff\n+" + string + "\n```";
}

module.exports.bluetext = function (string) {
    return "```fix\n" + string + "\n```"
}

module.exports.miscembed = function () {
    return new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })
}

module.exports.disabledbuttons = function (bid) {
    let graybidcustom = new ButtonBuilder()
        .setCustomId('customamount')
        .setLabel("Bid Custom Amount")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    let graybidmin = new ButtonBuilder()
        .setCustomId('minbid')
        .setLabel(`Bid ${bid} HAR`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    let graybidprebid = new ButtonBuilder()
        .setCustomId('prebid')
        .setLabel('Autobid')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)

    let graytoggle = new ButtonBuilder()
        .setCustomId('togglenotif')
        .setLabel("Toggle notification")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)

    return new ActionRowBuilder()
            .addComponents(graybidmin, graybidcustom, graybidprebid, graytoggle)
}

module.exports.genmessagelink = function(id) {
    let selectedah = listofauctions.find(x => x.id === id)
    let msgid = selectedah.msgid
    if (msgid === "deleted") return "Original embed message deleted"
    else return "Message link: https://discord.com/channels/313066655494438922/1249243661309444137/" + msgid
}