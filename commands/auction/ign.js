const { SlashCommandBuilder } = require('discord.js')
const { redtext } = require('../../functions/functions.js')
const { botchannelid } = require("../../data/settings.json");
const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
          .setName("ign")
          .setDescription("Get's the user's ign")
          .setDMPermission(false)
          .addUserOption(option => 
            option.setName("user")
                  .setDescription("User to search for; if unspecified will display yours")
          ),

    async execute(interaction) {
        if (interaction.channel.id !== botchannelid) return await interaction.reply({ content: redtext("You can only use this bot in charms-discussion!"), ephemeral: true })
        let user = interaction.options?.getUser("user")
        if(user) {
            let userdata = alluserdata.find(x => x.userid === user.id)
            if(!userdata) {
                let userdataobject = {
					"userid": user.id,
					"auctionswon": 0,
					"auctionbids": 0,
					"auctionhosts": 0,
					"totalharspent": 0,
					"ign": "Not set"
				}
                alluserdata.push(userdataobject)
                fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
            }
            else {
                let ign = userdata?.ign;
                if(!ign) {
                    userdata.ign = "Not Set"
                    interaction.reply({ content: "The user has not set an ign.", ephemeral: true })
                }
                else interaction.reply({ content: "Their ign is: `" + ign + "`", ephemeral: true})
            }
        } else {
            let owndata = alluserdata.find(x => x.userid === interaction.user.id)
            let ign = owndata?.ign;
            if(!ign) {
                owndata.ign = "Not Set";
                interaction.reply({ content: "You have not set an ign.", ephemeral: true});
            }
            else interaction.reply({ content: "Your ign is: `" + ign + "`", ephemeral: true})
        }
        fs.writeFileSync("./data/userdata.json", JSON.stringify(alluserdata, null, 4))
    }
}