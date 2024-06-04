const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, Embed } = require('discord.js')
const fs = require("fs")
const colors = JSON.parse(fs.readFileSync("./data/colors.json"))
const { redtext, greentext, bluetext, capfirstletter, disabledbuttons } = require("./functions.js")


const bidcustomamount = new ButtonBuilder()
    .setCustomId('customamount')
    .setLabel('Bid Custom Amount')
    .setStyle(ButtonStyle.Primary);

const bidprebid = new ButtonBuilder()
    .setCustomId('prebid')
    .setLabel('Pre-bid')
    .setStyle(ButtonStyle.Primary)

// module.exports.addnotif = async function (id, interaction, authorid) {
//     let selectedah = listofauctions.find(x => x.id === id)
//     if (selectedah.notification.includes(authorid)) return await interaction.followUp({ content: redtext("You are already going to be notified for this auction!"), ephemeral: true })
//     else {
//         selectedah.notification.push(authorid)
//         fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
//     }
//     await interaction.followUp({ content: greentext("You will now be notified when the auction is about to, and after it ends!"), ephemeral: true })
// }

module.exports.bidmin = async function (id, interaction, authorid, indms) {
    let interactionsend = function (message, components) {
        if (!components) {
            if (indms === true) return interaction.channel.send({ content: message })
            else return interaction.followUp({ content: message, ephemeral: true })
        } else {
            if (indms === true) return interaction.channel.send({ content: message, components: [components] })
            else return interaction.followUp({ content: message, ephemeral: true, components: [components] })
        }

    }
    let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
    let bannedusers = settings.bannedusers
    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let currenttopbidder = selectedah.topbidder
    let owner = selectedah.owner
    let notifications = selectedah.notification
    let nextbid = selectedah.currentbid + increment
    let minbid = selectedah.minbid
    let endtime = selectedah.endtime
    let antisnipe = selectedah.antisnipe
    if (nextbid < minbid) nextbid = minbid
    let username = await client.users.cache.get(authorid).username
    let bidminamount = new ButtonBuilder()
        .setCustomId('minamount')
        .setLabel(`Bid ${nextbid + increment} HAR`)
        .setStyle(ButtonStyle.Primary);

    const ahembedrow = new ActionRowBuilder()
        .addComponents(bidminamount, bidcustomamount)
    if (Math.round(Date.now() / 1000) > endtime) return await interactionsend(redtext("This auction has ended!"))
    if (currenttopbidder === authorid) return await interactionsend(redtext("You are already the top bidder!"))
    if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))
    if (bannedusers.includes(authorid)) return await interactionsend(redtext("You are banned from bidding on an auction!"))
    const bidconfirmresponse = await interactionsend(bluetext(`Are you sure you want to bid ${nextbid} HAR on auction #${id}?`), confirmrow)
    const bidconfirmcollector = bidconfirmresponse.createMessageComponentCollector({ time: 60_000 })

    bidconfirmcollector.on('collect', async i => {
        i.deferUpdate()
        bidconfirmcollector.stop()
        if (i.customId === "confirm") {
            if (selectedah.currentbid + selectedah.increment > nextbid) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))
            if (endtime - (Date.now() / 1000) <= antisnipe) selectedah.endtime = (Date.now() / 1000) + antisnipe
            selectedah.currentbid = nextbid
            selectedah.topbidder = authorid
            selectedah.bids.push({ "user": authorid, "bid": nextbid })
            if (!selectedah.notification.includes(authorid)) selectedah.notification.push(authorid)

            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
            await interactionsend(greentext(`Bid Successful!`))
            for (i = 0; i < notifications.length; i++) {
                const msguser = notifications[i]
                if (msguser === owner) continue
                if (msguser === authorid) continue
                let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${nextbid} HAR!`), embeds: [module.exports.postbidembedgen(id, customamountbid, authorid)], components: [ahembedrow] }
                let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
                const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })

                collector.on('collect', async j => {
                    j.deferUpdate()
                    const selection = j.customId
                    collector.stop()
                    if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                    else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                })
            }
        }
    })
}

module.exports.bidcustom = async function (id, interaction, authorid, indms) {
    let interactionsend = function (message, components) {
        if (!components) {
            if (indms === true) return interaction.channel.send({ content: message })
            else return interaction.followUp({ content: message, ephemeral: true })
        } else {
            if (indms === true) return interaction.channel.send({ content: message, components: [components] })
            else return interaction.followUp({ content: message, ephemeral: true, components: [components] })
        }

    }
    let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
    let bannedusers = settings.bannedusers
    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let currenttopbidder = selectedah.topbidder
    let owner = selectedah.owner
    let notifications = selectedah.notification
    let username = await client.users.cache.get(authorid).username
    let nextbid = selectedah.currentbid + increment
    let minbid = selectedah.minbid
    let endtime = selectedah.endtime
    let antisnipe = selectedah.antisnipe
    if (nextbid < minbid) nextbid = minbid

    if (Math.round(Date.now() / 1000) > endtime) return await interactionsend(redtext("This auction has ended!"))
    else if (currenttopbidder === authorid) return await interactionsend(redtext("You are already the top bidder!"))
    else if (bannedusers.includes(authorid)) return await interactionsend(redtext("You are banned from bidding on an auction!"))
    else if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))
    const collectorFilter = (m) => m.author.id === authorid
    await interactionsend(bluetext(`How much would you like to bid on auction #${id}? Please type the amount in number.`))
    const messagecollector = interaction.channel.createMessageCollector({ filter: collectorFilter, time: 60_000 });

    messagecollector.on('collect', async m => {
        messagecollector.stop()
        let customamountbid = +m.content
        if (indms === false) {
            interaction.channel.messages.fetch(m.id)
                .then(message => message.delete())
        }
        if (!Number.isInteger(customamountbid)) return await interactionsend(redtext("Please only input a whole number!"))
        if (customamountbid > 9999) return await interactionsend(redtext("Invalid value! Please enter numbers below 10000."))
        if (nextbid > customamountbid) return await interactionsend(redtext("You cannot bid lower than the next minimum bid!"))
        const bidconfirmresponsecustom = await interactionsend(bluetext(`Are you sure you want to bid ${customamountbid} HAR on auction #${id}?`), confirmrow)
        const bidconfirmcollector = bidconfirmresponsecustom.createMessageComponentCollector({ time: 60_000 })
        bidconfirmcollector.on('collect', async i => {
            bidconfirmcollector.stop()
            i.deferUpdate()
            if (i.customId === "confirm") {
                if (selectedah.currentbid + selectedah.increment > customamountbid) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))
                if (endtime - (Date.now() / 1000) <= antisnipe) selectedah.endtime = (Date.now() / 1000) + antisnipe
                selectedah.currentbid = customamountbid
                selectedah.topbidder = authorid
                selectedah.bids.push({ "user": authorid, "bid": customamountbid })
                if (!selectedah.notification.includes(authorid)) selectedah.notification.push(authorid)

                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
                await interactionsend(greentext(`Bid Successful!`))

                let bidminamount = new ButtonBuilder()
                    .setCustomId('minamount')
                    .setLabel(`Bid ${customamountbid + increment} HAR`)
                    .setStyle(ButtonStyle.Primary);

                const ahembedrow = new ActionRowBuilder()
                    .addComponents(bidminamount, bidcustomamount)

                for (i = 0; i < notifications.length; i++) {
                    const msguser = notifications[i]
                    if (msguser === owner) continue
                    else if (msguser === authorid) continue
                    let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${customamountbid} HAR!`), embeds: [module.exports.postbidembedgen(id, customamountbid, authorid)], components: [ahembedrow] }
                    let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
                    const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })
                    collector.on('collect', async j => {
                        j.deferUpdate()
                        collector.stop()
                        const selection = j.customId
                        if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                        else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                    })
                }
            }
        })


    });
}

module.exports.biddms = async function (id, authorid) {
    let selectedah = listofauctions.find(x => x.id === id)
    let currentbid = selectedah.currentbid
    let minbid = selectedah.minbid
    let increment = selectedah.increment
    let endtime = selectedah.endtime

    if (currentbid < minbid) nextbid = minbid
    else nextbid = currentbid + increment

    let bidminamount = new ButtonBuilder()
        .setCustomId('minamount')
        .setLabel(`Bid ${nextbid} HAR`)
        .setStyle(ButtonStyle.Primary);

    if (Math.round(Date.now() / 1000) > endtime) ahembedrow = disabledbuttons(nextbid)
    else ahembedrow = new ActionRowBuilder().addComponents(bidminamount, bidcustomamount)

    const response = await client.users.send(authorid, { embeds: [module.exports.embedgen(id)], components: [ahembedrow] })
    const collector = response.createMessageComponentCollector({ time: 60_000 })

    collector.on('collect', async i => {
        i.deferUpdate()
        const selection = i.customId
        if (selection === "minamount") {
            module.exports.bidmin(id, i, authorid, true)
            collector.stop()
        }

        else if (selection === "customamount") {
            module.exports.bidcustom(id, i, authorid, true)
            collector.stop()
        }
    })
}

module.exports.postbidembedgen = function (id, newbid, authorid) {

    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let owner = selectedah.owner
    let endtime = selectedah.endtime
    let antisnipestring = selectedah.antisnipestring
    let charmclass = selectedah.class
    let image = selectedah.image
    let colorhex = colors[charmclass]

    let tagsarr = selectedah.tags
    if (tagsarr === undefined) tags = "None"
    else tags = tagsarr.join()

    let newahembed = new EmbedBuilder()
        .setTitle(capfirstletter(charmclass) + " Charm | Auction ID: #" + id)
        .setColor(colorhex)
        .addFields(
            { name: "Seller", value: `<@${owner}>`, inline: true },
            { name: "Ends in:", value: `<t:${endtime}:R>`, inline: true },
            { name: "Anti-snipe Length", value: antisnipestring, inline: true },
            { name: "\u200B", value: "\u200B" },
            { name: "Current Bid", value: newbid.toString() + " HAR " + `<@${authorid}>`, inline: true },
            { name: "Increment:", value: increment.toString() + " HAR", inline: true },
            { name: "Tags:", value: tags, inline: true },
        )
        .setImage(image)
        .setTimestamp()
        .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

    return newahembed;
}

module.exports.embedgen = function (id) {

    let selectedah = listofauctions.find(x => x.id === id)
    let currentbid = selectedah.currentbid
    let increment = selectedah.increment
    let currenttopbidder = selectedah.topbidder
    let owner = selectedah.owner
    let endtime = selectedah.endtime
    let antisnipestring = selectedah.antisnipestring
    let charmclass = selectedah.class
    let image = selectedah.image
    let colorhex = colors[charmclass]

    if (Math.round(Date.now() / 1000) > endtime) endtext = "__Ended__"
    else endtext = `<t:${endtime}:R>`

    if (currenttopbidder === 0) topbiddertext = "None"
    else topbiddertext = `${currentbid} HAR <@${currenttopbidder}>`

    let tagsarr = selectedah.tags
    if (tagsarr === undefined) tags = "None"
    else tags = tagsarr.join()


    let auctionembed = new EmbedBuilder()
        .setTitle(capfirstletter(charmclass) + " Charm | Auction ID: #" + id)
        .setColor(colorhex)
        .addFields(
            { name: "Seller", value: `<@${owner}>`, inline: true },
            { name: "Ends in:", value: endtext, inline: true },
            { name: "Anti-snipe Length", value: antisnipestring, inline: true },
            { name: "\u200B", value: "\u200B" },
            { name: "Current Bid", value: topbiddertext, inline: true },
            { name: "Increment:", value: increment.toString() + " HAR", inline: true },
            { name: "Tags:", value: tags, inline: true },
        )
        .setImage(image)
        .setTimestamp()
        .setFooter({ text: "If there are any issues, DM @pe.li!", iconURL: "https://static.wikia.nocookie.net/monumentammo/images/8/80/ItemTexturePortable_Parrot_Bell.png" })

    return auctionembed;
}

module.exports.auccheck = async function () {
    let currenttime = Math.round(Date.now() / 1000)
    for (let i = 0; i < listofauctions.length; i++) {
        let currentcheck = listofauctions[i]
        if (!currentcheck.id) continue
        let isauctionactive = currentcheck.active
        let auctionendtime = currentcheck.endtime
        let notifusers = currentcheck.notification
        let auctionid = currentcheck.id
        let auctopbidder = currentcheck.topbidder
        let aucowner = currentcheck.owner
        let ownername = await client.users.cache.get(aucowner).username
        if (auctopbidder !== 0) topbiddername = await client.users.cache.get(auctopbidder).username
        let curbid = currentcheck.currentbid
        if (isauctionactive === true && auctionendtime < currenttime) {
            currentcheck.active = false
            console.log(`${auctionid} ended, winner: ${auctopbidder}`)
            for (let j = 0; j < notifusers.length; j++) {
                let msguser = notifusers[j]
                if (msguser === auctopbidder) {
                    client.users.send(msguser, greentext(`You won the auction #${auctionid} for ${curbid} HAR! Please contact ${ownername} to collect your charm!`)).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> You won the auction #${auctionid} for ${curbid} HAR! Please contact ${ownername} to collect your charm!\nPlease enable DMs with the bot!`)))
                } else if (msguser === aucowner) {
                    if (auctopbidder === 0) client.users.send(msguser, redtext(`Your auction #${auctionid} has ended but with no bids!`)).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> Your auction #${auctionid} has ended but with no bids!\nPlease enable DMs with the bot!`)))
                    else client.users.send(msguser, greentext(`Your auction #${auctionid} has ended with the bid of ${curbid} HAR! Please contact ${topbiddername} to sell your charm.`)).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> Your auction #${auctionid} has ended with the bid of ${curbid} HAR! Please contact ${topbiddername} to sell your charm.\nPlease enable DMs with the bot!`)))
                } else client.users.send(msguser, greentext(`The auction #${auctionid} has ended with ${curbid} HAR as top bid! You unfortunately did not win the auction.`)).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
            }
            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
        }
        else if (isauctionactive === true && (auctionendtime - currenttime) < 3600 && (auctionendtime - currenttime) > 3540) {
            for (let j = 0; j < notifusers.length; j++) {
                let msguser = notifusers[j]
                client.users.send(msguser, bluetext(`The auction #${auctionid} is going to end in an hour!`)).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
            }
        }
    }
}

module.exports.prebid = async function (id, interaction, authorid, indms) {
    let interactionsend = function (message, components) {
        if (!components) {
            if (indms === true) return interaction.channel.send({ content: message })
            else return interaction.followUp({ content: message, ephemeral: true })
        } else {
            if (indms === true) return interaction.channel.send({ content: message, components: [components] })
            else return interaction.followUp({ content: message, ephemeral: true, components: [components] })
        }

    }
    let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
    let bannedusers = settings.bannedusers
    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let currenttopbidder = selectedah.topbidder
    let owner = selectedah.owner
    let notifications = selectedah.notification
    let username = await client.users.cache.get(authorid).username
    let nextbid = selectedah.currentbid + increment
    let minbid = selectedah.minbid
    let endtime = selectedah.endtime
    let antisnipe = selectedah.antisnipe
    if (nextbid < minbid) nextbid = minbid

    if (Math.round(Date.now() / 1000) > endtime) return await interactionsend(redtext("This auction has ended!"))
    else if (currenttopbidder === authorid) return await interactionsend(redtext("You are already the top bidder!"))
    else if (bannedusers.includes(authorid)) return await interactionsend(redtext("You are banned from bidding on an auction!"))
    else if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))
    const collectorFilter = (m) => m.author.id === authorid
    await interactionsend(bluetext(`How much would you like to pre-bid on auction #${id}? Please type the amount in number.`))
    const messagecollector = interaction.channel.createMessageCollector({ filter: collectorFilter, time: 60_000 });

    messagecollector.on('collect', async m => {
        messagecollector.stop()
        let prebidamount = +m.content
        if (indms === false) {
            interaction.channel.messages.fetch(m.id)
                .then(message => message.delete())
        }
        if (!Number.isInteger(prebidamount)) return await interactionsend(redtext("Please only input a whole number!"))
        if (prebidamount > 9999) return await interactionsend(redtext("Invalid value! Please enter numbers below 10000."))
        if (nextbid > prebidamount) return await interactionsend(redtext("You cannot bid lower than the next minimum bid!"))
        const bidconfirmresponsecustom = await interactionsend(bluetext(`Are you sure you want to pre-bid ${prebidamount} HAR on auction #${id}?`), confirmrow)
        const bidconfirmcollector = bidconfirmresponsecustom.createMessageComponentCollector({ time: 60_000 })
        bidconfirmcollector.on('collect', async i => {
            bidconfirmcollector.stop()
            i.deferUpdate()
            if (i.customId === "confirm") {
                if (selectedah.currentbid + selectedah.increment > prebidamount) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))
                if (endtime - (Date.now() / 1000) <= antisnipe) selectedah.endtime = (Date.now() / 1000) + antisnipe
                selectedah.currentbid = nextbid
                selectedah.topbidder = authorid
                selectedah.bids.push({ "user": authorid, "bid": nextbid })
                selectedah.prebids.push({ "user": authorid, "amount": prebidamount })
                if (!selectedah.notification.includes(authorid)) selectedah.notification.push(authorid)

                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
                await interactionsend(greentext(`Pre-bid Successful!`))

                let bidminamount = new ButtonBuilder()
                    .setCustomId('minamount')
                    .setLabel(`Bid ${nextbid + increment} HAR`)
                    .setStyle(ButtonStyle.Primary);

                const ahembedrow = new ActionRowBuilder()
                    .addComponents(bidminamount, bidcustomamount, bidprebid)

                for (i = 0; i < notifications.length; i++) {
                    const msguser = notifications[i]
                    if (msguser === owner) continue
                    else if (msguser === authorid) continue
                    let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${nextbid} HAR!`), embeds: [module.exports.postbidembedgen(id, customamountbid, authorid)], components: [ahembedrow] }
                    let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch('1242696457870508061').then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
                    const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })
                    collector.on('collect', async j => {
                        j.deferUpdate()
                        collector.stop()
                        const selection = j.customId
                        if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                        else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                    })
                }
            }
        })


    });
}

// module.exports.prebidcheck = async function (id, bid, authorid, prebid) {
//     let selectedah = listofauctions.find(x => x.id === id)
//     let increment = selectedah.increment
//     let prebids = selectedah.prebids
//     if(prebids.length === 1) return
//     let prebidamount = prebids[1].amount
//     let prebiduser = prebids[1].user

//     if(prebid) {
//         if(bid > prebidamount) {
            
//         }
//         else if (prebidamount > bid) {

//         }
//         else if (prebidamount === bid) {

//         }
//     }
// }