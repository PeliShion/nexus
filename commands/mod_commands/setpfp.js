const { SlashCommandBuilder } = require('discord.js')
const { redtext } = require('../../functions/functions.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setpfp")
        .setDescription("Set the profile image of the bot")
        .addAttachmentOption(option => 
            option.setName("image")
                  .setDescription("image")
                  .setRequired(true)
        ),

    async execute(interaction) {
        if (interaction.user.id !== "492965189038374933") return await interaction.reply({ content: redtext("You cannot use this command!"), ephemeral: true })
        let image = interaction.options.getAttachment("image")
        client.user.setAvatar(image)
    }
}