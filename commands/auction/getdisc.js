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
                  .setDescription("User to search for using ign")
                  .setRequired(true)
          ),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        let ign = interaction.options?.getString("ign")
        let userdata = alluserdata.find(x => x.ign === ign)
        if(!userdata) {
            interaction.reply({ content: "The user has not set an ign.", ephemeral: true});
        }
        else interaction.reply({ content: "Their ign is: `" + ign + "`", ephemeral: true})
    }
}