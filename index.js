const { Client, Events, GatewayIntentBits, Collection, PresenceUpdateStatus, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { token, newaucchannelid } = require('./data/settings.json');
const fs = require('node:fs');
const path = require('node:path')
const { auccheck, biddms } = require('./functions/ahmanager.js');
global.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences] });
global.listofauctions = JSON.parse(fs.readFileSync("./data/auctions.json"))
client.commands = new Collection();

const confirmation = new ButtonBuilder()
	.setCustomId('confirm')
	.setLabel('Confirm')
	.setStyle(ButtonStyle.Primary);

global.confirmrow = new ActionRowBuilder()
	.addComponents(confirmation)

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, () => {
	//sets status, activity, and start loop for every minute to run auction check
	console.log(`Booted`);
	client.user.setStatus(PresenceUpdateStatus.Idle);
	client.user.setActivity('Celestial Zenith')
	global.boottime = Math.round(Date.now() / 1000)
	client.channels.fetch(newaucchannelid).then((channel) => {
		console.log(`collector on`)
		const collector = channel.createMessageComponentCollector()
		collector.on('collect', async i => {
			i.deferUpdate()
			let collected = +i.customId
			biddms(collected, i.user.id)
		})
	})
	setInterval(() => {
		auccheck()
	}, 60000);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	console.log(`${interaction.user.username} used ${interaction.commandName}`)
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});



client.login(token)