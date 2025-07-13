const { SlashCommandBuilder } = require('discord.js')
const { redtext } = require('../../functions/functions.js')
const { botchannelid } = require("../../data/settings.json");
const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
          .setName("setqc")
          .setDescription("Sets your qc settings")
          .setDMPermission(false)
          .addStringOption(option => 
                option.setName("length")
                  .setDescription("Length of the auction (in h or d)")
                  .setRequired(true)
                  .setMaxLength(3)
           )
           .addIntegerOption(option => 
                option.setName("startingbid")
                  .setDescription("Starting bid")
                  .setRequired(true)
                  .setMaxValue(2000)
           )
            .addIntegerOption(option =>
                  option.setName("increment")
                    .setDescription("Minimum increase in bid amount in HAR")
                    .setRequired(true)
                    .setMaxValue(100))
            .addIntegerOption(option =>
                  option.setName("antisnipe")
                    .setDescription("Legnth of antisnipe in hours. Set to 0 for no antisnipe")
                    .setRequired(true)
                    .setMaxValue(24))
           ,

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        let length = interaction.options.getString("length")
        let startingbid = interaction.options.getInteger("startingbid")
        let increment = interaction.options.getInteger("increment")
        let antisnipe = interaction.options.getInteger("antisnipe")
        let userdata = alluserdata.find(x => x.userid === interaction.user.id)
        
        if (length.includes("h")) ahlengthinsec = +(length.replace(/[a-zA-Z]/g, "")) * 3600
        else if (length.includes("d")) ahlengthinsec = +(length.replace(/[a-zA-Z]/g, "")) * 86400
        else return await interaction.editReply({ content: redtext("Please input a valid time for auction length in h or d!"), ephemeral: true })
        
        userdata.qc.length = ahlengthinsec
        userdata.qc.startingbid = startingbid
        userdata.qc.increment = increment
        userdata.qc.antisnipe = antisnipe

        interaction.reply({ content: "Success.", ephemeral: true})
        fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
    }
}
