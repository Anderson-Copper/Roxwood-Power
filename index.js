// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const info = require('./info');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.id !== info.channelCommandeID) return;
  if (!message.embeds.length) return;

  const embed = message.embeds[0];
  const entreprise = info.detectionEntreprise(embed);
  if (!entreprise) return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`urgence_${message.id}`).setLabel('⚡ Urgence').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`livre_${message.id}`).setLabel('⛽ Livré').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`facture_${message.id}`).setLabel('💳 Facture envoyée').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`regle_${message.id}`).setLabel('✅ Facture réglée').setStyle(ButtonStyle.Secondary)
  );

  await message.reply({ content: `Commande détectée pour ${entreprise.nom}`, components: [row] });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, messageId] = interaction.customId.split('_');
  const originalMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
  if (!originalMessage) return;

  const response = info.messages[action];
  if (!response) return;

  await interaction.update({ content: response, components: [] });
  await originalMessage.react('✅');
  await originalMessage.delete().catch(() => {});
});

client.login(process.env.DISCORD_TOKEN_PWR);
