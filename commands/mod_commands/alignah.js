const { SlashCommandBuilder } = require('discord.js')
const { modroleid } = require("../../data/settings.json");
const { prebidcheck } = require("../../functions/ahmanager.js")
const { greentext, redtext } = require('../../functions/functions.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("updateautobid")
        .setDescription("Runs autobid check for specific auction [Mod Only]")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("ID of the auction to check")
                .setRequired(true)
        )
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has(modroleid)) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        let id = interaction.options.getInteger("id")
        let selectedah = listofauctions.find(x => x.id === id)
        if (!selectedah) return await interaction.reply({ content: redtext(`Could not find auction #${id}!`), ephemeral: true })
        prebidcheck(id)
        interaction.reply({content: greentext(`The bid has been updated!`), ephemeral: true})
    }
}