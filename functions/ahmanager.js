const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, AttachmentBuilder, escapeNumberedList } = require('discord.js')
const fs = require("fs")
const colors = JSON.parse(fs.readFileSync("./data/colors.json"))
const { redtext, greentext, bluetext, capfirstletter, disabledbuttons, miscembed, genmessagelink } = require("./functions.js")
const { botchannelid, logchannelid, newaucchannelid } = require("../data/settings.json")

const bidcustomamount = new ButtonBuilder()
    .setCustomId('customamount')
    .setLabel('Bid Custom Amount')
    .setStyle(ButtonStyle.Primary);

const bidprebid = new ButtonBuilder()
    .setCustomId('prebid')
    .setLabel('Autobid')
    .setStyle(ButtonStyle.Primary)

const togglenotif = new ButtonBuilder()
    .setCustomId('togglenotif')
    .setLabel("Toggle notification")
    .setStyle(ButtonStyle.Success)

const notifrow = new ActionRowBuilder().addComponents(togglenotif)

module.exports.togglenotif = async function (id, interaction, authorid) {
    let selectedah = listofauctions.find(x => x.id === id)
    let index = selectedah.blocknotif.indexOf(authorid);
    if (index !== -1) {
        selectedah.blocknotif.splice(index, 1);
        await interaction.channel.send({ content: greentext("You will be notified when you get outbidded for this auction.") })
    }
    else {
        selectedah.blocknotif.push(authorid)
        await interaction.channel.send({ content: greentext("You will no longer be notified when outbidded on this auction.") })
    }
    fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
}

module.exports.sendnotif = async function(id, bid, authorid) {
    let selectedah = listofauctions.find(x => x.id === id);
    let notifications = selectedah.notification
    let increment = selectedah.increment
    let attachment = new AttachmentBuilder(`./images/${id}.png`, { name: `${id}.png` })

    let bidminamount = new ButtonBuilder()
    .setCustomId('minamount')
    .setLabel(`Bid ${bid + increment} HAR`)
    .setStyle(ButtonStyle.Primary);

    const ahembedrow = new ActionRowBuilder()
    .addComponents(bidminamount, bidcustomamount, bidprebid, togglenotif)

    for (i = 0; i < notifications.length; i++) {
        //send a notification to everyone who is participating in the auction
        const msguser = notifications[i]
        if (msguser === authorid) continue
        if (selectedah.blocknotif.includes(msguser)) continue
        if (msguser === selectedah.owner) {
            let ownermessage = { content: bluetext(`Your auction #${id} now has ${bid} HAR as current bid!`) + `\n` + genmessagelink(id), embeds: [module.exports.postbidembedgen(id)], files: [attachment], components: [notifrow] }
            await client.users.send(msguser, ownermessage)
            .then(ownermsg => {
                const collector = ownermsg.createMessageComponentCollector({ time: 86400_00 })
                collector.on('collect', async m => {
                    m.deferUpdate()
                    module.exports.togglenotif(id, m, msguser)
                })
            })
            .catch((e) => console.log(e))
        } 
        else {
            let sendmessage = { content: bluetext(`You have been outbidded for ${bid} HAR!`) + `\n` + genmessagelink(id), embeds: [module.exports.postbidembedgen(id)], components: [ahembedrow], files: [attachment] }
            await client.users.send(msguser, sendmessage)
            .then(outbidresponse => {
                const collector = outbidresponse.createMessageComponentCollector({ time: 86400_00 })
                
                collector.on('collect', async j => {
                    //if the buttons in dms has been pressed, run function depending on what the user has chosen
                    j.deferUpdate()
                    const selection = j.customId
                    collector.stop()
                    if (selection === 'minamount') module.exports.bidmin(id, j, msguser)
                    else if (selection === 'customamount') module.exports.bidcustom(id, j, msguser)
                    else if (selection === 'prebid') module.exports.prebid(id, j, msguser)
                    else if (selection === 'togglenotif') module.exports.togglenotif(id, j, msguser)
                })
            })
            .catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
        }
    }
}

module.exports.bidmin = async function (id, interaction, authorid) {
    //function to run if a user chooses to bid next minimum bid.

    //relic of the previous system, will be reworked soon
    let interactionsend = function (message, components) {
        if (!components) return interaction.channel.send({ content: message })
        else return interaction.channel.send({ content: message, components: [components] })
    }

    //turning all the relevant data into variables
    console.log(`${interaction.user.username} is minbidding on #${id}`)
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
    let nextbid = selectedah.currentbid + increment
    let currenttopbidder = selectedah.topbidder
    let minbid = selectedah.minbid
    let endtime = selectedah.endtime
    let antisnipe = selectedah.antisnipe
    if (nextbid < minbid) nextbid = minbid

    //multiple checks to see if the user can bid
    if (Math.round(Date.now() / 1000) > endtime) return await interactionsend(redtext("This auction has ended!"))
    if (currenttopbidder === authorid) return await interactionsend(redtext("You are already the top bidder!"))
    if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))

    //confirmation of if the user wants to bid
    const bidconfirmresponse = await interactionsend(bluetext(`Are you sure you want to bid ${nextbid} HAR on auction #${id}?`), confirmrow)
    const bidconfirmcollector = bidconfirmresponse.createMessageComponentCollector({ time: 600_000 })

    bidconfirmcollector.on('collect', async i => {
        i.deferUpdate()
        bidconfirmcollector.stop()
        if (i.customId === "confirm") {
            //if confirmed, first check if anyone else has bid, if not proceed
            if (selectedah.currentbid + selectedah.increment > nextbid) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))

            //extend the time of the auction to antisnipe length if the time is below antisnipe length
            if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe
            let userdata = alluserdata.find(x => x.userid === authorid)
            userdata.auctionbids++
            fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
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
            module.exports.sendnotif(id, nextbid, authorid);
            module.exports.prebidcheck(id)
            module.exports.updateembed(id)
        }
    })
}

module.exports.bidcustom = async function (id, interaction, authorid) {
    //most of the process is same as bidmin function, so please refer to it if you are unsure
    let interactionsend = function (message, components) {
        if (!components) return interaction.channel.send({ content: message })
        else return interaction.channel.send({ content: message, components: [components] })
    }
    console.log(`${interaction.user.username} is custom bidding on #${id}`)
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
    let nextbid = selectedah.currentbid + increment
    let currentbid = selectedah.currentbid
    let minbid = selectedah.minbid
    let endtime = selectedah.endtime
    let antisnipe = selectedah.antisnipe
    if (currentbid == 0) nextbid = minbid

    if (Math.round(Date.now() / 1000) > endtime) return await interactionsend(redtext("This auction has ended!"))
    else if (currenttopbidder === authorid) return await interactionsend(redtext("You are already the top bidder!"))
    else if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))
    const collectorFilter = (m) => m.author.id === authorid
    await interactionsend(bluetext(`How much would you like to bid on auction #${id}? Please type the amount in number.`))
    const messagecollector = interaction.channel.createMessageCollector({ filter: collectorFilter, time: 600_000 });

    messagecollector.on('collect', async m => {
        messagecollector.stop()
        let customamountbid = +m.content

        //multiple checks to see if the inputted data is valid (if it's integer, if it's over 9999, if it's lower than next minimum bid)
        if (!Number.isInteger(customamountbid)) return await interactionsend(redtext("Please only input a whole number!"))
        if (customamountbid > 9999) return await interactionsend(redtext("Invalid value! Please enter numbers below 10000."))
        if (nextbid > customamountbid) return await interactionsend(redtext("You cannot bid lower than the next minimum bid!"))

        //confirmation message if they are sure they want to bid
        const bidconfirmresponsecustom = await interactionsend(bluetext(`Are you sure you want to bid ${customamountbid} HAR on auction #${id}?`), confirmrow)
        const bidconfirmcollector = bidconfirmresponsecustom.createMessageComponentCollector({ time: 600_000 })
        bidconfirmcollector.on('collect', async i => {
            bidconfirmcollector.stop()
            i.deferUpdate()
            if (i.customId === "confirm") {
                if (selectedah.currentbid + selectedah.increment > customamountbid) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))
                if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe
                let userdata = alluserdata.find(x => x.userid === authorid)
                userdata.auctionbids++
                fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
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
                module.exports.sendnotif(id, customamountbid, authorid);
                module.exports.prebidcheck(id)
                module.exports.updateembed(id)
            }
        })
    });
}

module.exports.biddms = async function (id, authorid) {
    //this function is used to send details of the auction to a user's dm (used in new-auctions channel, and getah)

    //find the specific auction and set up variables
    let selectedah = listofauctions.find(x => x.id === id)
    if (!selectedah) return await client.users.send(authorid, { content: redtext(`Auction #${id} was not found! Maybe they were deleted?`) })
    let currentbid = selectedah.currentbid
    let minbid = selectedah.minbid
    let increment = selectedah.increment
    let endtime = selectedah.endtime
    let attachment = new AttachmentBuilder(`./images/${id}.png`, { name: `${id}.png` })
    let userdata = alluserdata.find(x => x.userid === authorid)
    if (!userdata) {
        let userdataobject = {
            "userid": authorid,
            "auctionswon": 0,
            "auctionbids": 0,
            "auctionhosts": 0,
            "totalharspent": 0,
            "ign": "Not Set",
        }
        alluserdata.push(userdataobject)
        fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
    }

    //check if there is any bid, if there is next bid = current bid + increments, if not minimum bid
    if (currentbid < minbid) nextbid = minbid
    else nextbid = currentbid + increment

    let bidminamount = new ButtonBuilder()
        .setCustomId('minamount')
        .setLabel(`Bid ${nextbid} HAR`)
        .setStyle(ButtonStyle.Primary);

    //disable the bid buttons if the auction is over
    if (Math.round(Date.now() / 1000) > endtime) ahembedrow = disabledbuttons(nextbid)
    else ahembedrow = new ActionRowBuilder().addComponents(bidminamount, bidcustomamount, bidprebid, togglenotif)

    //send the user dm with the buttons, if the user chooses to bid, run the function
    //if sending dm fails, send them an error message in bot channel
    const response = await client.users.send(authorid, { content: genmessagelink(id), embeds: [module.exports.embedgen(id)], components: [ahembedrow], files: [attachment] }).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${authorid}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
    const collector = response.createMessageComponentCollector({ time: 600_000 })

    collector.on('collect', async i => {
        i.deferUpdate()
        collector.stop()
        const selection = i.customId
        if (selection === "minamount") module.exports.bidmin(id, i, authorid)
        else if (selection === "customamount") module.exports.bidcustom(id, i, authorid)
        else if (selection === 'prebid') module.exports.prebid(id, i, authorid)
        else if (selection === 'togglenotif') module.exports.togglenotif(id, i, authorid)
    })
}

module.exports.postbidembedgen = function (id) {

    //embed generator after the user bids.
    //find the auction and set up variables

    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let owner = selectedah.owner
    let endtime = selectedah.endtime
    let antisnipestring = selectedah.antisnipestring
    let charmclass = selectedah.class
    let anonymity = selectedah.anonymity
    let ownerun = selectedah.ownerun
    if(!ownerun) ownertext = " "
    else ownertext = `\`${ownerun}\``
    if (anonymity === true) topbidder = "Anonymous"
    else topbidder = `<@${selectedah.topbidder}>`
    let currentbid = selectedah.currentbid
    let rarity = selectedah.rarity
    let colorhex = colors[charmclass]
    let aucname = selectedah.aucname

    let attachment = new AttachmentBuilder(`./images/${id}.png`, { name: `${id}.png` })
    // let tagsarr = selectedah.tags
    // if (tagsarr === undefined) tags = "None"
    // else tags = tagsarr.join()

    let newahembed = new EmbedBuilder()
        .setTitle(aucname + " | ID: #" + id)
        .setColor(colorhex)
        .addFields(
            { name: "Seller", value: `<@${owner}> ${ownertext}`, inline: true },
            { name: "Ends", value: `<t:${endtime}:R>`, inline: true },
            { name: "Anti-snipe Length", value: antisnipestring, inline: true },
            { name: "\u200B", value: "\u200B" },
            { name: "Current Bid", value: currentbid.toString() + " HAR " + topbidder, inline: true },
            { name: "Increment", value: increment.toString() + " HAR", inline: true },
            { name: "Rarity | Class", value: `${rarity} | ${charmclass}`, inline: true },
        )
        .setImage(`attachment://${attachment.name}`)
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

    // let tagsarr = selectedah.tags
    // if (tagsarr === undefined) tags = "None"
    // else tags = tagsarr.join()

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
    return auctionembed;
}

module.exports.auccheck = async function () {
    //auction checks to see if they have ended
    //this is used in index.js, and ran every minute
    let currenttime = Math.round(Date.now() / 1000)
    let guild = await client.guilds.fetch("313066655494438922")
    guild.members.fetch()
    for (let i = 0; i < listofauctions.length; i++) {
        //loop through the auction data
        //set up variables
        let currentcheck = listofauctions[i]
        if (!currentcheck.id) continue
        let isauctionactive = currentcheck.active
        let auctionendtime = currentcheck.endtime
        let notifusers = currentcheck.notification
        let auctionid = currentcheck.id
        let curbid = currentcheck.currentbid
        let starttime = currentcheck.starttime
        let aucowner = currentcheck.owner
        if (isauctionactive === true && auctionendtime < currenttime) {
            let auctopbidder = currentcheck.topbidder
            await client.users.fetch(aucowner)
            if (auctopbidder != 0) await client.users.fetch(auctopbidder)
            let ownerusername = await client.users.cache.get(aucowner).username
            let ownerdata = alluserdata.find(x => x.userid === aucowner)
            let winnerdata = alluserdata.find(x => x.userid === auctopbidder)
            let ownerign = ownerdata.ign || "Not Set"
            let winnerign; 
            if (auctopbidder) topbidusername = await client.users.cache.get(auctopbidder).username, winnerign = winnerdata.ign || "Not Set"
            let attachment = new AttachmentBuilder(`./images/${auctionid}.png`, { name: `${auctionid}.png` })
            //check if an auction has ended
            //if it has, send the owner, top bidder, and other bidders notifications
            //if it fails to dm, send it in bot channel instead
            if(curbid === 0) {
                await client.channels.cache.get(newaucchannelid).messages.fetch(currentcheck.msgid).then(message => message.delete()).catch((err) => console.log(err))
                currentcheck.msgid = "deleted"
                fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
            }
            let aucendlog = miscembed()
                .setTitle(`Auction #${auctionid} ended`)
                .setDescription(`Winner: <@${auctopbidder}>\nOwner: <@${aucowner}>\nAmount: ${curbid} HAR`)
                .setColor(0xffff00)
            await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [aucendlog] }))
            currentcheck.active = false
            console.log(`${auctionid} ended, winner: ${auctopbidder} for ${curbid} HAR`)
            for (let j = 0; j < notifusers.length; j++) {
                let msguser = notifusers[j]
                if (msguser === auctopbidder) {
                    winnerdata.auctionswon++
                    winnerdata.totalharspent = userdata.totalharspent + curbid
                    fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
                    client.users.send(msguser, ({ content: bluetext(`You won the auction #${auctionid} for ${curbid} HAR! Please contact ${ownerusername} to collect your charm!\nTheir ign: ${ownerign}`), embeds: [module.exports.embedgen(auctionid)], files: [attachment] })).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`> <@${msguser}> You won the auction #${auctionid} for ${curbid} HAR! Please contact ${ownerusername} to collect your charm!\nPlease enable DMs with the bot!`)))
                } else if (msguser === aucowner) {
                    if (auctopbidder === 0) client.users.send(msguser, ({ content: redtext(`Your auction #${auctionid} has ended but with no bids!`), embeds:[module.exports.embedgen(auctionid)], files: [attachment] })).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`> <@${msguser}> Your auction #${auctionid} has ended but with no bids!\nPlease enable DMs with the bot!`)))
                    else client.users.send(msguser, ({ content: bluetext(`Your auction #${auctionid} has ended with the bid of ${curbid} HAR! Please contact ${topbidusername} to sell your charm.\nTheir ign: ${winnerign}`), embeds: [module.exports.embedgen(auctionid)], files: [attachment] })).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`> <@${msguser}> Your auction #${auctionid} has ended with the bid of ${curbid} HAR! Please contact ${topbidusername} to sell your charm.\nPlease enable DMs with the bot!`)))
                } else client.users.send(msguser, ({ content: redtext(`The auction #${auctionid} has ended with ${curbid} HAR as top bid! You unfortunately did not win the auction.`), embeds: [module.exports.embedgen(auctionid)], files: [attachment] })).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`> <@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
            }
            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
        }
        else if (isauctionactive === true && (auctionendtime - currenttime) < 3600 && (auctionendtime - currenttime) > 3540) {
            let attachment = new AttachmentBuilder(`./images/${auctionid}.png`, { name: `${auctionid}.png` })
            for (let j = 0; j < notifusers.length; j++) {
                //check if an auction has an hour left, and if it is, send users notification
                let aucowner = currentcheck.owner
                let msguser = notifusers[j]
                if (msguser === aucowner) continue
                else if (currentcheck.blocknotif.includes(msguser)) continue
                client.users.send(msguser, { content: bluetext(`The auction #${auctionid} is going to end in an hour!`) + `\n` + genmessagelink(auctionid), embeds: [module.exports.embedgen(auctionid)], files: [attachment] }).catch((e) => client.channels.fetch(botchannelid).then(channel => channel.send(`<@${msguser}> I tried to message you in DMs, but I couldn't! Please unblock or enable DMs!`)))
            }
        }
        else if (isauctionactive === false && (currenttime - auctionendtime) > 43200 && currentcheck.msgid !== "deleted") {
            await client.channels.cache.get(newaucchannelid).messages.fetch(currentcheck.msgid).then(message => message.delete()).catch((err) => console.log(err))
            currentcheck.msgid = "deleted"
            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
        }
        else if (isauctionactive === true && curbid === 0 && (currenttime > starttime + 172800)) {
            await client.channels.cache.get(newaucchannelid).messages.fetch(currentcheck.msgid).then(message => message.delete()).catch((err) => console.log(err))
            currentcheck.msgid = "deleted"
            currentcheck.active = false
            console.log(`#${auctionid} has been deleted as it had no bids for 48 hours`)
            let attachment = new AttachmentBuilder(`./images/${auctionid}.png`, { name: `${auctionid}.png` })
            await client.users.send(aucowner, { content: bluetext(`Auction #${auctionid} had no bids for 48 hours, and has been deleted!`), embeds: [module.exports.embedgen(auctionid)], files: [attachment]})
            let aucendlog = miscembed()
                .setTitle(`Auction #${auctionid} deleted`)
                .setDescription(`Owner: <@${aucowner}> | No bids after 48 hours`)
                .setColor(0xff0000)
            await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [aucendlog] }))
            fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
        }
    }
}

module.exports.bancheck = async function (timenow) {
    let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
    let bannedusers = settings.bannedusers
    if (!bannedusers) return
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

module.exports.prebid = async function (id, interaction, authorid) {
    let interactionsend = function (message, components) {
        if (!components) return interaction.channel.send({ content: message })
        else return interaction.channel.send({ content: message, components: [components] })
    }
    //grab auction data
    console.log(`${interaction.user.username} is autobidding on #${id}`)
    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let owner = selectedah.owner
    let nextbid = selectedah.currentbid + increment
    let currentbid = selectedah.currentbid
    let minbid = selectedah.minbid
    let endtime = selectedah.endtime
    let antisnipe = selectedah.antisnipe
    let currenttopbidder = selectedah.topbidder
    if (currentbid == 0) nextbid = minbid

    //usual auction checks
    if (Math.round(Date.now() / 1000) > endtime) return await interactionsend(redtext("This auction has ended!"))
    else if (authorid === owner) return await interactionsend(redtext("You cannot bid on your own auction!"))
    const collectorFilter = (m) => m.author.id === authorid
    await interactionsend(bluetext(`How much would you like to autobid on auction #${id}? Please type the amount in number.`))
    const messagecollector = interaction.channel.createMessageCollector({ filter: collectorFilter, time: 600_000 });

    messagecollector.on('collect', async m => {
        messagecollector.stop()
        let prebidamount = +m.content
        //more bid checks
        if (!Number.isInteger(prebidamount)) return await interactionsend(redtext("Please only input a whole number!"))
        if (prebidamount > 9999) return await interactionsend(redtext("Invalid value! Please enter numbers below 10000."))
        if (nextbid > prebidamount) return await interactionsend(redtext("You cannot bid lower than the next minimum bid!"))
        if (authorid === selectedah.prebids[0].user && prebidamount > currentbid) autobidconfirmmsg = bluetext(`Are you sure you want to overwrite your existing prebid of ${selectedah.prebids[0].amount} HAR to ${prebidamount} HAR on auction #${id}?`)
        else if (authorid === currenttopbidder) autobidconfirmmsg = bluetext(`Are you sure you want to set your autobid as ${prebidamount} HAR on auction #${id}?`)
        else autobidconfirmmsg = bluetext(`Are you sure you want to immediately bid ${nextbid} HAR and autobid ${prebidamount} HAR on auction #${id}?`)
        const bidconfirmresponsecustom = await interactionsend(autobidconfirmmsg, confirmrow)
        const bidconfirmcollector = bidconfirmresponsecustom.createMessageComponentCollector({ time: 600_000 })
        bidconfirmcollector.on('collect', async i => {
            bidconfirmcollector.stop()
            i.deferUpdate()
            let userdata = alluserdata.find(x => x.userid === authorid)
            userdata.auctionbids++
            fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
            if (i.customId === "confirm") {
                if (authorid === selectedah.prebids[0].user && selectedah.prebids[0].amount >= prebidamount) return await interactionsend(redtext(`You cannot lower your autobid!`))  
                await interactionsend(greentext(`Autobid Successful!`))
                //if confirmed, bid immediately and add the user to "autobid" on the auction.
                //if the existing autobid is larger than the one that has been bid, automatically bid up until previous one's maximum
                if (selectedah.currentbid + selectedah.increment > prebidamount) return await interactionsend(redtext("Failed to bid! Maybe someone else bid before you?"))
                if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe
                if (!selectedah.notification.includes(authorid)) selectedah.notification.push(authorid)
                let prebids = selectedah.prebids
                let existingprebid = prebids[0].amount
                let prebiduser = prebids[0].user
                if (prebidamount > existingprebid) {
                    if (authorid === selectedah.prebids[0].user && selectedah.prebids[0].amount < prebidamount && selectedah.prebids[0].amount > currentbid + increment) {
                        selectedah.prebids[0].amount = prebidamount
                        selectedah.prebids[0].user = authorid
                        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
                        module.exports.updateembed(id)
                        let prebidsubmitlog = miscembed()
                        .setTitle(`Autobid updated for auction #${id}`)
                        .setDescription(`Bidder: <@${authorid}>\nAmount: ${prebidamount} HAR`)
                        .setColor(0xCCCCFF)
                        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [prebidsubmitlog] }))
                    }
                    else if (authorid === currenttopbidder) {
                        selectedah.prebids[0].amount = prebidamount
                        selectedah.prebids[0].user = authorid
                        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
                        module.exports.updateembed(id)
                        let prebidsubmitlog = miscembed()
                        .setTitle(`Autobid submitted for auction #${id}`)
                        .setDescription(`Bidder: <@${authorid}>\nAmount: ${prebidamount} HAR`)
                        .setColor(0xCCCCFF)
                        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [prebidsubmitlog] }))
                    }
                    else {
                        selectedah.prebids[0].amount = prebidamount
                        selectedah.prebids[0].user = authorid
                        if (currentbid === 0) nextcurbid = minbid
                        else if (currentbid >= existingprebid) nextcurbid = currentbid + increment
                        else if (existingprebid + increment > prebidamount) nextcurbid = prebidamount
                        else nextcurbid = existingprebid + increment
                        selectedah.currentbid = nextcurbid
                        selectedah.topbidder = authorid
                        selectedah.bids.push({ "user": authorid, "bid": nextcurbid })
                        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
    
                        if (existingprebid > currentbid) await interactionsend(bluetext(`There was another autobid submitted, so your bid has been adjusted accordingly to beat it!`))
    
                        let prebidsubmitlog = miscembed()
                            .setTitle(`Autobid submitted for auction #${id}`)
                            .setDescription(`Bidder: <@${authorid}>\nAmount: ${prebidamount} HAR`)
                            .setColor(0xCCCCFF)
                        let bidcustomlog = miscembed()
                            .setTitle(`Bid on auction #${id}`)
                            .setDescription(`Bidder: <@${authorid}>\nAmount: ${nextcurbid} HAR`)
                            .setColor(0xCCCCFF)
    
                        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [prebidsubmitlog] }))
                        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [bidcustomlog] }))
                        module.exports.updateembed(id)
                        module.exports.sendnotif(id, nextcurbid, authorid)
                    }
                } else {
                    if (existingprebid < prebidamount + increment) nextcurbid = existingprebid
                    else nextcurbid = prebidamount + increment
                    await interactionsend(bluetext(`There was another autobid submitted, which beat or was equal to yours! The current bid is now ${nextcurbid}.`))
                    selectedah.currentbid = nextcurbid
                    selectedah.topbidder = prebiduser
                    selectedah.bids.push({ "user": authorid, "bid": prebidamount})
                    selectedah.bids.push({ "user": prebiduser, "bid": nextcurbid })
                    fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));

                    let attachment = new AttachmentBuilder(`./images/${id}.png`, { name: `${id}.png` })
                    let prebidtriggermsg = { content: greentext(`Your autobid on auction #${id} has triggered, bidding ${nextcurbid} HAR!`) + `\n` + genmessagelink(id), embeds: [module.exports.postbidembedgen(id)], files: [attachment] }
                    await client.users.send(prebiduser, prebidtriggermsg)
                    
                    let prebidsubmitlog = miscembed()
                        .setTitle(`Autobid submitted for auction #${id}`)
                        .setDescription(`Bidder: <@${authorid}>\nAmount: ${prebidamount} HAR`)
                        .setColor(0xCCCCFF)
                    let bidcustomlog = miscembed()
                        .setTitle(`Bid on auction #${id}`)
                        .setDescription(`Bidder: <@${selectedah.topbidder}>\nAmount: ${nextcurbid} HAR`)
                        .setColor(0xCCCCFF)

                    await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [prebidsubmitlog] }))
                    await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [bidcustomlog] }))
                    module.exports.updateembed(id)
                    module.exports.sendnotif(id, nextcurbid, authorid)
                }
            }
        })
    });
}

module.exports.prebidcheck = async function (id) {
    //grab auction information
    let selectedah = listofauctions.find(x => x.id === id)
    let increment = selectedah.increment
    let currentbid = selectedah.currentbid
    let antisnipe = selectedah.antisnipe
    let endtime = selectedah.endtime
    let prebids = selectedah.prebids
    let attachment = new AttachmentBuilder(`./images/${id}.png`, { name: `${id}.png` })
    let prebidamount = prebids[0].amount
    //if there are no prebids, do nothing
    if (prebidamount === 0) return
    let prebiduser = prebids[0].user
    if (currentbid + increment <= prebidamount) {
        //if prebid is higher than current bid, immediately bid for min. increment
        if (endtime - Math.round(Date.now() / 1000) <= antisnipe) selectedah.endtime = Math.round(Date.now() / 1000) + antisnipe
        if (currentbid + (increment * 2) > prebidamount) nextbidamount = prebidamount
        else nextbidamount = currentbid + increment
        selectedah.currentbid = nextbidamount
        selectedah.topbidder = prebiduser
        selectedah.bids.push({ "user": prebiduser, "bid": nextbidamount })
        let userdata = alluserdata.find(x => x.userid === prebiduser)
        userdata.auctionbids++
        fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
        let prebidlog = miscembed()
            .setTitle(`Bid on auction #${id}`)
            .setDescription(`Bidder: <@${prebiduser}>\nAmount: ${nextbidamount} HAR (This is an autobid)`)
            .setColor(0xCCCCFF)
        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [prebidlog] }))
        let prebidtriggermsg = { content: greentext(`Your autobid on auction #${id} has triggered, bidding ${nextbidamount} HAR!`) + `\n` + genmessagelink(id), embeds: [module.exports.postbidembedgen(id)], files: [attachment] }
        await client.users.send(prebiduser, prebidtriggermsg)
        fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));

        module.exports.updateembed(id)
        module.exports.sendnotif(id, nextbidamount, prebiduser)
        
    } else return //else do nothing
}

module.exports.updateembed = async function (id) {
    let selectedah = listofauctions.find(x => x.id === id)
    let msgid = selectedah.msgid
    let attachment = new AttachmentBuilder(`./images/${id}.png`, { name: `${id}.png` })
    const showdetails = new ButtonBuilder()
        .setCustomId(`${id}`)
        .setLabel("Show Auction Details")
        .setStyle(ButtonStyle.Success)
    const detailrow = new ActionRowBuilder().addComponents(showdetails)
    client.channels.cache.get(newaucchannelid).messages.fetch(msgid).then(message => message.edit({ embeds: [module.exports.postbidembedgen(id)], components: [detailrow], files: [attachment] }))
}