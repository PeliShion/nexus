const { SlashCommandBuilder } = require('discord.js')
const { biddms } = require('../../functions/ahmanager.js')
const { greentext } = require('../../functions/functions.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enablecollector')
        .setDescription('Enables Button Collectors [Mod Only] Do not use unless you know what you are doing!!!'),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933") return await interaction.reply({ content: "You cannot use this command!", ephemeral: true })
        const collector = interaction.channel.createMessageComponentCollector()
        await interaction.reply({ content: greentext("Collector enabled!"), ephemeral:true})
        collector.on('collect', async i => {
            i.deferUpdate()
            let collected = +i.customId
            biddms(collected, i.user.id)
        })
    }
}

//this whole thing will be reworked on official release