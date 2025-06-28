const { SlashCommandBuilder } = require('discord.js')
const { redtext } = require('../../functions/functions.js')
const { botchannelid } = require("../../data/settings.json");

module.exports = {
    data: new SlashCommandBuilder()
          .setName("ign")
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
        userdata.ign = newign
        interaction.reply("Your new ign has been set to: `" + ign + "`")
        fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
    }
}