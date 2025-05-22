const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, Routes, REST, ThreadAutoArchiveDuration } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// LTDs
const LTD_CHANNELS = {
  'Grove Street': { color: 0xFF0000 },
  'Little Seoul': { color: 0x00FF00 },
  'Sandy Shores': { color: 0xFFA500 },
  'Roxwood':      { color: 0x0099FF }
};

const CONSO_CHANNEL_ID = '1374906428418031626';

// Données fictives (remplace par les vraies plus tard)
const data = {
  'Grove Street':   { actuel: 0, objectif: 10000 },
  'Little Seoul':   { actuel: 0, objectif: 12000 },
  'Sandy Shores':   { actuel: 0, objectif: 15000 },
  'Roxwood':        { actuel: 0, objectif: 8000 }
};

function generateEmbed(ltdName, color) {
  return new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${ltdName}`)
    .setDescription(`🔋 Remplissage : **${data[ltdName].actuel}L / ${data[ltdName].objectif}L**`)
    .setColor(color)
    .setFooter({ text: 'Mis à jour automatiquement' })
    .setTimestamp();
}

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  // Enregistrement dynamique de la commande
  const commands = [
    new SlashCommandBuilder()
      .setName('creer-embed')
      .setDescription('Crée les 4 embeds de consommation des LTD')
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

  console.log('✅ Commande slash /creer-embed enregistrée');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'creer-embed') return;

  console.log(`[CMD] /creer-embed utilisé par ${interaction.user.tag}`);

  await interaction.reply({ content: '📊 Création des embeds...', ephemeral: true });

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);

  const now = new Date();
  const thread = await channel.threads.create({
    name: `🧾 Archives - ${now.toLocaleDateString('fr-FR')}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
  });

  for (const [name, ltd] of Object.entries(LTD_CHANNELS)) {
    const embed = generateEmbed(name, ltd.color);
    await thread.send({ embeds: [embed] });
    await channel.send({ embeds: [embed] });
  }

  await interaction.editReply('✅ Embeds créés et archivés dans 📉・𝐂𝐨𝐧𝐬𝐨𝐦𝐦𝐚𝐭𝐢𝐨𝐧.');
});

client.login(process.env.DISCORD_TOKEN_PWR);

