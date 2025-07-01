const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js')
const { expiredchid } = require("../../data/settings.json");
const { redtext } = require('../../functions/functions.js');
const { embedgen } = require('../../functions/ahmanager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("repost")
        .setDescription("Reposts all old auctions chronologically")
        .setDMPermission(false)
        .addIntegerOption(option =>
            option.setName("start")
                .setDescription("Where to start reposting from")
        ),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933") return await interaction.reply({ content: redtext("Yer can't use this"), ephemeral: true })
        let startNum = interaction.options.getInteger("start")
        let i;
        if(!startNum) i = 0;
        else i = startNum;
        
        let sendEmbeds = setInterval(() => {
            let curid = listofauctions[i].id
            if(listofauctions[i].active === false) {
                let attachment = new AttachmentBuilder(`./images/${curid}.png`, { name: `${curid}.png` })
                interaction.channel.send({ embeds: [embedgen(curid)], files: [attachment]})
            }
            i++;
            if(i === listofauctions.length) clearInterval(sendEmbeds);
        }, 500);
    }
}
