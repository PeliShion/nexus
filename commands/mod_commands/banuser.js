const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")
const { greentext, redtext, miscembed } = require('../../functions/functions.js')
const { modroleid, logchannelid } = require("../../data/settings.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banuser")
        .setDescription("Ban a user from making/bidding on an auction [Mod Only]")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User you would like to ban")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("duration")
                .setDescription("Duration of the ban, in h or d. Leaving it empty will set it to indefinite")
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason of the ban")
        ),
    async execute(interaction) {
        let settings = JSON.parse(fs.readFileSync("./data/settings.json"))
        let bannedusers = settings.bannedusers
        let user = interaction.options.getUser("user") //turn the collected argument into variable
        let duration = interaction.options.getString("duration")
        let reason = interaction.options.getString("reason")

        //calculate durations 
        if (duration == null) durationins = 0
        else if (duration?.includes("h")) durationins = +(duration.replace(/[a-zA-Z]/g, "")) * 3600
        else if (duration?.includes("d")) durationins = +(duration.replace(/[a-zA-Z]/g, "")) * 86400
        else return await interaction.reply({ content: redtext("Please input a valid time for duration in h or d!"), ephemeral: true })
        //set up text if the given variables are unspecified
        if (duration == null) duratext = "Indefinite"
        else duratext = duration

        if (durationins === 0) expiretime = 0
        else expiretime = Math.round(Date.now() / 1000) + durationins

        if (reason == null) reasontext = "Unspecified"
        else reasontext = reason

        //check if the user running the command has permission to ban
        //if it is not the owner of the bot (Peli) and does not have moderator role, send them an error message
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has(modroleid)) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })

        let banneduserobj = {
            "user": user.id,
            "end": expiretime,
            "reason": reasontext
        }
        //if the user is valid, push the user to banned users array and save it 
        bannedusers.push(banneduserobj)
        fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4))
        await interaction.reply({ content: greentext(`You have successfully banned ${user.username}!`), ephemeral: true })
        let banuserlog = miscembed()
            .setTitle(`Banned ${user.username}`)
            .setDescription(`Banned by <@${interaction.user.id}> for ${duratext}.\nReason: ${reasontext} `)
            .setColor(0xff0000)
        await client.channels.fetch(logchannelid).then(channel => channel.send({ embeds: [banuserlog] }))
    }
}