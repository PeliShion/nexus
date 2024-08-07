const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js')
const fs = require("fs")
const colors = JSON.parse(fs.readFileSync("./data/colors.json"))
const { redtext, greentext, bluetext, capfirstletter, disabledbuttons, miscembed } = require("./functions.js")
const { botchannelid, logchannelid } = require("../data/settings.json")


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
    //function to run if a user chooses to bid next minimum bid.

    //this is to check if the message being sent to is in dms or in a channel
    let interactionsend = function (message, components) {
        if (!components) {
            if (indms === true) return interaction.channel.send({ content: message })
            else return interaction.followUp({ content: message, ephemeral: true })
        } else {
            if (indms === true) return interaction.channel.send({ content: message, components: [components] })
            else return interaction.followUp({ content: message, ephemeral: true, components: [components] })
        }
    }

    //turning all the relevant data into variables
    let settings = JSON.parse(fs.readFileSync('./data/settings.json'))
    let bannedusers = settings.bannedusers
    for (i = 0; i < bannedusers.length; i++) {
        let user = bannedusers[i].user
        if (authorid === user) return interactionsend(redtext(`You are banned from running a command!`))
        else continue
    }
    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
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
        .addComponents(bidminamount, bidcustomamount, bidprebid)

    //multiple checks to see if the user can bid
    if (Math.round(Date.now() / 1000) > endtime) return await interactionsend(redtext("This auction has ended!"))
    if (currenttopbidder === authorid) return await interactionsend(redtext("You are already the top bidder!"))
    if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))

    //confirmation of if the user wants to bid
    const bidconfirmresponse = await interactionsend(bluetext(`Are you sure you want to bid ${nextbid} HAR on auction #${id}?`), confirmrow)
    const bidconfirmcollector = bidconfirmresponse.createMessageComponentCollector({ time: 60_000 })

    bidconfirmcollector.on('collect', async i => {
        i.deferUpdate()
        bidconfirmcollector.stop()
        if (i.customId === "confirm") {
            //if confirmed, first check if anyone else has bid, if not proceed
            if (selectedah.currentbid + selectedah.increment > nextbid) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))

            //extend the time of the auction to antisnipe length if the time is below antisnipe length
            if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe

            //update the current bid and top bidder, and push the bid to bids array, and if the user was not notified prior (if this is their first bid), add them to notification
            selectedah.currentbid = nextbid
            selectedah.topbidder = authorid
            selectedah.bids.push({ "user": authorid, "bid": nextbid })
            if (!selectedah.notification.includes(authorid)) selectedah.notification.push(authorid)
            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));

            let bidminlog = miscembed()
                .setTitle(`Bid on auction #${id}`)
                .setDescription(`Bidder: <@${authorid}>\nAmount: ${nextbid} HAR`)
                .setColor(0xCCCCFF)
            await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [bidminlog] }))
            await interactionsend(greentext(`Bid Successful!`))
            for (i = 0; i < notifications.length; i++) {
                //send a notification to everyone who is participating in the auction
                const msguser = notifications[i]
                if (msguser === owner) continue
                if (msguser === authorid) continue
                let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${nextbid} HAR!`), embeds: [module.exports.postbidembedgen(id, nextbid, authorid)], components: [ahembedrow] }
                let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
                const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })

                collector.on('collect', async j => {
                    //if the buttons in dms has been pressed, run function depending on what the user has chosen
                    j.deferUpdate()
                    const selection = j.customId
                    collector.stop()
                    if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                    else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                    else if (selection === 'prebid') module.exports.prebid(id, j, msguser, true)
                })
            }
            module.exports.prebidcheck(id)
        }
    })
}

module.exports.bidcustom = async function (id, interaction, authorid, indms) {
    //most of the process is same as bidmin function, so please refer to it if you are unsure
    let interactionsend = function (message, components) {
        if (!components) {
            if (indms === true) return interaction.channel.send({ content: message })
            else return interaction.followUp({ content: message, ephemeral: true })
        } else {
            if (indms === true) return interaction.channel.send({ content: message, components: [components] })
            else return interaction.followUp({ content: message, ephemeral: true, components: [components] })
        }

    }
    let settings = JSON.parse(fs.readFileSync('./data/settings.json'))
    let bannedusers = settings.bannedusers
    for (i = 0; i < bannedusers.length; i++) {
        let user = bannedusers[i].user
        if (authorid === user) return interactionsend(redtext(`You are banned from running a command!`))
        else continue
    }
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
    else if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))
    const collectorFilter = (m) => m.author.id === authorid
    await interactionsend(bluetext(`How much would you like to bid on auction #${id}? Please type the amount in number.`))
    const messagecollector = interaction.channel.createMessageCollector({ filter: collectorFilter, time: 60_000 });

    messagecollector.on('collect', async m => {
        messagecollector.stop()
        let customamountbid = +m.content

        //delete the message if it is NOT in dms
        if (indms === false) {
            interaction.channel.messages.fetch(m.id)
                .then(message => message.delete())
        }

        //multiple checks to see if the inputted data is valid (if it's integer, if it's over 9999, if it's lower than next minimum bid)
        if (!Number.isInteger(customamountbid)) return await interactionsend(redtext("Please only input a whole number!"))
        if (customamountbid > 9999) return await interactionsend(redtext("Invalid value! Please enter numbers below 10000."))
        if (nextbid > customamountbid) return await interactionsend(redtext("You cannot bid lower than the next minimum bid!"))

        //confirmation message if they are sure they want to bid
        const bidconfirmresponsecustom = await interactionsend(bluetext(`Are you sure you want to bid ${customamountbid} HAR on auction #${id}?`), confirmrow)
        const bidconfirmcollector = bidconfirmresponsecustom.createMessageComponentCollector({ time: 60_000 })
        bidconfirmcollector.on('collect', async i => {
            bidconfirmcollector.stop()
            i.deferUpdate()
            if (i.customId === "confirm") {
                if (selectedah.currentbid + selectedah.increment > customamountbid) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))
                if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe
                selectedah.currentbid = customamountbid
                selectedah.topbidder = authorid
                selectedah.bids.push({ "user": authorid, "bid": customamountbid })
                if (!selectedah.notification.includes(authorid)) selectedah.notification.push(authorid)
                let bidcustomlog = miscembed()
                    .setTitle(`Bid on auction #${id}`)
                    .setDescription(`Bidder: <@${authorid}>\nAmount: ${customamountbid} HAR`)
                    .setColor(0xCCCCFF)

                await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [bidcustomlog] }))
                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
                await interactionsend(greentext(`Bid Successful!`))

                let bidminamount = new ButtonBuilder()
                    .setCustomId('minamount')
                    .setLabel(`Bid ${customamountbid + increment} HAR`)
                    .setStyle(ButtonStyle.Primary);

                const ahembedrow = new ActionRowBuilder()
                    .addComponents(bidminamount, bidcustomamount, bidprebid)

                for (i = 0; i < notifications.length; i++) {
                    const msguser = notifications[i]
                    if (msguser === owner) continue
                    else if (msguser === authorid) continue
                    let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${customamountbid} HAR!`), embeds: [module.exports.postbidembedgen(id, customamountbid, authorid)], components: [ahembedrow] }
                    let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
                    const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })
                    collector.on('collect', async j => {
                        j.deferUpdate()
                        collector.stop()
                        const selection = j.customId
                        if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                        else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                        else if (selection === 'prebid') module.exports.prebid(id, j, msguser, true)
                    })
                }
                module.exports.prebidcheck(id)
            }
        })


    });
}

module.exports.biddms = async function (id, authorid) {
    //this function is used to send details of the auction to a user's dm (used in new-auctions channel, and getah)

    //find the specific auction and set up variables
    let selectedah = listofauctions.find(x => x.id === id)
    if (!selectedah) await client.users.send(authorid, { content: redtext(`Auction #${id} was not found! Maybe they were deleted?`) })
    let currentbid = selectedah.currentbid
    let minbid = selectedah.minbid
    let increment = selectedah.increment
    let endtime = selectedah.endtime

    //check if there is any bid, if there is next bid = current bid + increments, if not minimum bid
    if (currentbid < minbid) nextbid = minbid
    else nextbid = currentbid + increment

    let bidminamount = new ButtonBuilder()
        .setCustomId('minamount')
        .setLabel(`Bid ${nextbid} HAR`)
        .setStyle(ButtonStyle.Primary);

    //disable the bid buttons if the auction is over
    if (Math.round(Date.now() / 1000) > endtime) ahembedrow = disabledbuttons(nextbid)
    else ahembedrow = new ActionRowBuilder().addComponents(bidminamount, bidcustomamount, bidprebid)

    //send the user dm with the buttons, if the user chooses to bid, run the function
    //if sending dm fails, send them an error message in bot channel
    const response = await client.users.send(authorid, { embeds: [module.exports.embedgen(id)], components: [ahembedrow] }).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
    const collector = response.createMessageComponentCollector({ time: 60_000 })

    collector.on('collect', async i => {
        i.deferUpdate()
        collector.stop()
        const selection = i.customId
        if (selection === "minamount") module.exports.bidmin(id, i, authorid, true)
        else if (selection === "customamount") module.exports.bidcustom(id, i, authorid, true)
        else if (selection === 'prebid') module.exports.prebid(id, i, authorid, true)
    })
}

module.exports.postbidembedgen = function (id, newbid, authorid) {

    //embed generator after the user bids.
    //find the auction and set up variables
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
    //embed generator to display auctions with id
    //find the auction and set up variables
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

    //if the auction has ended, ends in text displays ended
    if (Math.round(Date.now() / 1000) > endtime) endtext = "__Ended__"
    else endtext = `<t:${endtime}:R>`

    //if there are no bidders, current top bidder becomes none
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
    //auction checks to see if they have ended
    //this is used in index.js, and ran every minute
    let currenttime = Math.round(Date.now() / 1000)
    for (let i = 0; i < listofauctions.length; i++) {
        //loop through the auction data
        //set up variables
        let currentcheck = listofauctions[i]
        if (!currentcheck.id) continue
        let isauctionactive = currentcheck.active
        let auctionendtime = currentcheck.endtime
        let notifusers = currentcheck.notification
        let auctionid = currentcheck.id
        let auctopbidder = currentcheck.topbidder
        let aucowner = currentcheck.owner
        let ownername = await client.users.cache.get(aucowner).username //get the auction's owner's username
        if (auctopbidder !== 0) topbiddername = await client.users.cache.get(auctopbidder).username //get the auction's top bidder's username
        let curbid = currentcheck.currentbid
        if (isauctionactive === true && auctionendtime < currenttime) {
            //check if an auction has ended
            //if it has, send the owner, top bidder, and other bidders notifications
            //if it fails to dm, send it in bot channel instead
            let aucendlog = miscembed()
                .setTitle(`Auction #${auctionid} ended`)
                .setDescription(`Winner: <@${auctopbidder}>\nOwner: <@${aucowner}>\nAmount: ${curbid} HAR`)
                .setColor(0xffff00)
            await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [aucendlog] }))
            currentcheck.active = false
            console.log(`${auctionid} ended, winner: ${auctopbidder}`)
            for (let j = 0; j < notifusers.length; j++) {
                let msguser = notifusers[j]
                if (msguser === auctopbidder) {
                    client.users.send(msguser, greentext(`You won the auction #${auctionid} for ${curbid} HAR! Please contact ${ownername} to collect your charm!`)).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> You won the auction #${auctionid} for ${curbid} HAR! Please contact ${ownername} to collect your charm!\nPlease enable DMs with the bot!`)))
                } else if (msguser === aucowner) {
                    if (auctopbidder === 0) client.users.send(msguser, redtext(`Your auction #${auctionid} has ended but with no bids!`)).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> Your auction #${auctionid} has ended but with no bids!\nPlease enable DMs with the bot!`)))
                    else client.users.send(msguser, greentext(`Your auction #${auctionid} has ended with the bid of ${curbid} HAR! Please contact ${topbiddername} to sell your charm.`)).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> Your auction #${auctionid} has ended with the bid of ${curbid} HAR! Please contact ${topbiddername} to sell your charm.\nPlease enable DMs with the bot!`)))
                } else client.users.send(msguser, greentext(`The auction #${auctionid} has ended with ${curbid} HAR as top bid! You unfortunately did not win the auction.`)).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
            }
            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
        }
        else if (isauctionactive === true && (auctionendtime - currenttime) < 3600 && (auctionendtime - currenttime) > 3540) {
            for (let j = 0; j < notifusers.length; j++) {
                //check if an auction has an hour left, and if it is, send users notification
                let msguser = notifusers[j]
                client.users.send(msguser, bluetext(`The auction #${auctionid} is going to end in an hour!`)).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
            }
        }
    }
}

module.exports.bancheck = async function (timenow) {
    let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
    let bannedusers = settings.bannedusers
    for (i = 0; i < bannedusers.length; i++) {
        let bancheck = bannedusers[i].end
        let user = bannedusers[i].user
        if (timenow > bancheck) {
            if (bancheck === 0) continue
            bannedusers.splice(i, 1)
            fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4))
            let banexpirelog = miscembed()
                .setTitle(`Ban expired`)
                .setDescription(`User: <@${user}>`)
                .setColor(0x00ff00)
            await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [banexpirelog] }))
        }
    }
}

//prebid is not finished yet
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
        //if (nextbid > prebidamount) return await interactionsend(redtext("You cannot bid lower than the next minimum bid!"))
        const bidconfirmresponsecustom = await interactionsend(bluetext(`Are you sure you want to pre-bid ${prebidamount} HAR on auction #${id}?`), confirmrow)
        const bidconfirmcollector = bidconfirmresponsecustom.createMessageComponentCollector({ time: 60_000 })
        bidconfirmcollector.on('collect', async i => {
            bidconfirmcollector.stop()
            i.deferUpdate()
            if (i.customId === "confirm") {
                await interactionsend(greentext(`Pre-bid Successful!`))
                if (selectedah.currentbid + selectedah.increment > prebidamount) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))
                if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe
                if (!selectedah.notification.includes(authorid)) selectedah.notification.push(authorid)
                let prebids = selectedah.prebids
                let existingprebid = prebids[0].amount
                let prebiduser = prebids[0].user
                if (prebidamount > existingprebid) {
                    selectedah.prebids[0].amount = prebidamount
                    selectedah.prebids[0].user = authorid
                    if (existingprebid + increment > prebidamount) nextcurbid = prebidamount
                    else nextcurbid = existingprebid + increment
                    selectedah.currentbid = nextcurbid
                    selectedah.topbidder = authorid
                    selectedah.bids.push({ "user": authorid, "bid": nextcurbid })
                    fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));

                    let bidminamount = new ButtonBuilder()
                        .setCustomId('minamount')
                        .setLabel(`Bid ${nextcurbid + increment} HAR`)
                        .setStyle(ButtonStyle.Primary);

                    const ahembedrow = new ActionRowBuilder()
                        .addComponents(bidminamount, bidcustomamount, bidprebid)

                    let bidcustomlog = miscembed()
                        .setTitle(`Bid on auction #${id}`)
                        .setDescription(`Bidder: <@${authorid}>\nAmount: ${nextcurbid} HAR`)
                        .setColor(0xCCCCFF)

                    await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [bidcustomlog] }))

                    for (i = 0; i < notifications.length; i++) {
                        const msguser = notifications[i]
                        if (msguser === owner) continue
                        else if (msguser === authorid) continue
                        let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${nextcurbid} HAR!`), embeds: [module.exports.postbidembedgen(id, nextcurbid, authorid)], components: [ahembedrow] }
                        let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
                        const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })
                        collector.on('collect', async j => {
                            j.deferUpdate()
                            collector.stop()
                            const selection = j.customId
                            if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                            else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                            else if (selection === 'prebid') module.exports.prebid(id, j, msguser, true)
                        })
                    }
                } else {
                    if (existingprebid < prebidamount + increment) nextcurbid = existingprebid
                    else nextcurbid = prebidamount + increment
                    selectedah.currentbid = nextcurbid
                    selectedah.topbidder = prebiduser
                    fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));

                    let bidminamount = new ButtonBuilder()
                        .setCustomId('minamount')
                        .setLabel(`Bid ${nextcurbid + increment} HAR`)
                        .setStyle(ButtonStyle.Primary);

                    const ahembedrow = new ActionRowBuilder()
                        .addComponents(bidminamount, bidcustomamount, bidprebid)

                    for (i = 0; i < notifications.length; i++) {
                        const msguser = notifications[i]
                        if (msguser === owner) continue
                        else if (msguser === authorid) continue
                        let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${nextcurbid} HAR!`), embeds: [module.exports.postbidembedgen(id, nextcurbid, authorid)], components: [ahembedrow] }
                        let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
                        const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })
                        collector.on('collect', async j => {
                            j.deferUpdate()
                            collector.stop()
                            const selection = j.customId
                            if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                            else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                            else if (selection === 'prebid') module.exports.prebid(id, j, msguser, true)
                        })
                    }

                }
            }
        })
    });
}

module.exports.prebidcheck = async function (id) {
    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let currentbid = selectedah.currentbid
    let antisnipe = selectedah.antisnipe
    let endtime = selectedah.endtime
    let prebids = selectedah.prebids
    let notifications = selectedah.notification
    let prebidamount = prebids[0].amount
    if (prebidamount === 0) return
    let prebiduser = prebids[0].user
    let username = await client.users.cache.get(prebiduser).username
    if (currentbid + increment <= prebidamount) {
        if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe
        if (currentbid + (increment * 2) > prebidamount) nextbidamount = prebidamount
        else nextbidamount = currentbid + increment
        selectedah.currentbid = nextbidamount
        selectedah.topbidder = prebiduser
        selectedah.bids.push({ "user": prebiduser, "bid": nextbidamount })
        let prebidlog = miscembed()
            .setTitle(`Bid on auction #${id}`)
            .setDescription(`Bidder: <@${prebiduser}>\nAmount: ${nextbidamount} HAR (This is a pre-bid)`)
            .setColor(0xCCCCFF)
        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [prebidlog] }))
        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
        let bidminamount = new ButtonBuilder()
            .setCustomId('minamount')
            .setLabel(`Bid ${nextbidamount + increment} HAR`)
            .setStyle(ButtonStyle.Primary);

        const ahembedrow = new ActionRowBuilder()
            .addComponents(bidminamount, bidcustomamount, bidprebid)

        for (i = 0; i < notifications.length; i++) {
            const msguser = notifications[i]
            if (msguser === owner) continue
            else if (msguser === prebiduser) continue
            let sendmessage = { content: bluetext(`You have been outbidded by ${username} for ${nextbidamount} HAR!`), embeds: [module.exports.postbidembedgen(id, nextbidamount, authorid)], components: [ahembedrow] }
            let outbidresponse = await client.users.send(msguser, sendmessage).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
            const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })
            collector.on('collect', async j => {
                j.deferUpdate()
                collector.stop()
                const selection = j.customId
                if (selection === 'minamount') module.exports.bidmin(id, j, msguser, true)
                else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser, true)
                else if (selection === 'prebid') module.exports.prebid(id, j, msguser, true)
            })
        }
    } else return
}