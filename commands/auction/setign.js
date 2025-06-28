const { SlashCommandBuilder } = require('discord.js')
const { redtext } = require('../../functions/functions.js')
const { botchannelid } = require("../../data/settings.json");
const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
          .setName("setign")
          .setDescription("Sets your ign")
          .setDMPermission(false)
          .addStringOption(option => 
            option.setName("ign")
                  .setDescription("The new ign to set")
                  .setRequired(true)
          ),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        let newign = interaction.options.getString("ign")
        let userdata = alluserdata.find(x => x.userid === interaction.user.id)
        if(newign.length > 100) return interaction.reply({ content: "The ign has to be less than 100 characters long.", ephemeral: true})
        userdata.ign = newign
        interaction.reply({ content: "Your new ign has been set to: `" + newign + "`", ephemeral: true})
        fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
    }
}
