const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Salon où l'embed sera envoyé (📉・𝐂𝐨𝐧𝐬𝐨𝐦𝐦𝐚𝐭𝐢𝐨𝐧)
const CONSO_CHANNEL_ID = '1374906428418031626';

// Enregistrement de la commande au démarrage
client.once('ready', async () => {
  console.log(`✅ Bot consommation connecté en tant que ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('creer-embed')
      .setDescription("Crée un embed de test dans 📉・𝐂𝐨𝐧𝐬𝐨𝐦𝐦𝐚𝐭𝐢𝐨𝐧")
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commande /creer-embed enregistrée');
  } catch (err) {
    console.error('❌ Erreur enregistrement commande :', err);
  }
});

// Quand un utilisateur utilise une commande
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'creer-embed') return;

  await interaction.deferReply({ ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('📊 Test Suivi de consommation')
    .setDescription('🔋 Remplissage : **0L / 10000L**')
    .setColor(0x0099FF)
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    await channel.send({ embeds: [embed] });

    await interaction.editReply({ content: '✅ Embed envoyé dans 📉・𝐂𝐨𝐧𝐬𝐨𝐦𝐦𝐚𝐭𝐢𝐨𝐧 !' });
  } catch (err) {
    console.error('❌ Erreur envoi embed :', err);
    await interaction.editReply({ content: '❌ Impossible d’envoyer l’embed.' });
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);

