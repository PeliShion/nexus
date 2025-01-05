const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("temp")
        .setDescription("[Mod Only]")
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933") return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        for (let i = 1100; i < 1248; i++) {
            let ahcheck = listofauctions.find(x => x.id === id)
            if(!ahcheck) continue
            console.log(ahcheck.id)
            if(ahcheck.active === true) {
                ahcheck.endtime = ahcheck.endtime + 84000
            }
            if(i === 1247) fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
        }
    }
}