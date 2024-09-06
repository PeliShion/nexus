const { SlashCommandBuilder } = require('discord.js')
const { modroleid } = require("../../data/settings.json");
const { updateembed } = require("../../functions/ahmanager.js")
const { greentext, redtext } = require('../../functions/functions.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("updateah")
        .setDescription("Updates the embed of auction [Mod only]")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("ID of the auction to update")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933" && !interaction.member.roles.cache.has(modroleid)) return await interaction.reply({ content: redtext("You need to be a moderator to use this command!"), ephemeral: true })
        let id = interaction.options.getInteger("id")
        let selectedah = listofauctions.find(x => x.id === id)
        if (!selectedah) return await interaction.reply({ content: redtext(`Could not find auction #${id}!`), ephemeral: true })
        updateembed(id)
        interaction.reply({content: greentext(`The embed has been updated!`), ephemeral: true})
    }
}