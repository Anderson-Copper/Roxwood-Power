const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Salon de destination
const CONSO_CHANNEL_ID = '1374906428418031626';

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  // Enregistrement dynamique
  const commands = [
    new SlashCommandBuilder()
      .setName('creer-embed')
      .setDescription('Crée un embed de test dans 📉・𝐂𝐨𝐧𝐬𝐨𝐦𝐦𝐚𝐭𝐢𝐨𝐧')
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

  console.log('✅ Commande slash /creer-embed enregistrée');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'creer-embed') return;

  console.log(`[CMD] /creer-embed exécutée par ${interaction.user.tag}`);
  await interaction.reply({ content: '✅ Embed envoyé.', ephemeral: true });

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setTitle('📦 Commande Test')
    .setDescription(`Test de création d'un embed.\nQuantité : **500 Pommes** 🍎`)
    .setColor(0x00AAFF)
    .setTimestamp();

  await channel.send({ embeds: [embed] });
});

client.login(process.env.DISCORD_TOKEN_PWR);

