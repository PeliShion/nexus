const { SlashCommandBuilder } = require('discord.js')
const { redtext } = require('../../functions/functions.js')
const { botchannelid } = require("../../data/settings.json");

module.exports = {
    data: new SlashCommandBuilder()
          .setName("getdisc")
          .setDescription("Get's the user's discord")
          .setDMPermission(false)
          .addStringOption(option => 
            option.setName("ign")
                  .setDescription("User to search for using ign, case-insensitive")
                  .setRequired(true)
          ),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        let ign = interaction.options?.getString("ign")
        let userdata = alluserdata.find(x => x.ign.toLowerCase() === ign.toLowerCase())
        if(!userdata) {
            interaction.reply({ content: "Could not find a user with ign `" + ign + "`", ephemeral: true});
        }
        else interaction.reply({ content: "Their Discord User is: <@" + userdata.userid + ">", ephemeral: true})
    }
}