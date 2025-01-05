const { SlashCommandBuilder } = require('discord.js')
const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("temp")
        .setDescription("[Mod Only]")
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933") return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        for (let i = 1100; i < listofauctions.length + 1; i++) {
            let ahcheck = listofauctions[i]
            if(!ahcheck) continue
            console.log(i)
            if(ahcheck.active === true) {
                ahcheck.endtime = ahcheck.endtime + 84000
            }
            if(i === listofauctions.length) fs.writeFileSync("./data/auctions.json", JSON.stringify(listofauctions, null, 4));
            continue
        }
    }
}