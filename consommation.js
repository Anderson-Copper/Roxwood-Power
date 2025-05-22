const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, Routes, REST, ThreadAutoArchiveDuration } = require('discord.js');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Config LTD
const LTD_CHANNELS = {
  '1375134527118381066': { name: 'Grove Street', color: 0xFF0000 },
  '1375134545275523243': { name: 'Little Seoul', color: 0x00FF00 },
  '1375134573314445422': { name: 'Sandy Shores', color: 0xFFA500 },
  '1375134589189754940': { name: 'Roxwood', color: 0x0099FF },
};

const CONSO_CHANNEL_ID = '1374906428418031626';
const CONSO_WEBHOOK = 'https://discord.com/api/webhooks/1375161041876680847/kqrCZQpOs2J8atEFCIwXSt4dBtsY7zUqE_wkZiCfp4ceCWoFUD5nXJeyTxq7mNXFOgrg';
const LOG_DEPOT_ID = '1375153166424866867';
const ROLE_ADMIN_ID = '1375058990152548372';

const DATA_FILE = './data.json';
let data = {};

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  } else {
    for (const ltd of Object.values(LTD_CHANNELS)) {
      data[ltd.name] = { objectif: 0, actuel: 0 };
    }
    saveData();
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateEmbed(ltdName, color) {
  return new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${ltdName}`)
    .setDescription(`🔋 Remplissage : **${data[ltdName].actuel}L / ${data[ltdName].objectif}L**`)
    .setColor(color)
    .setFooter({ text: 'Mis à jour automatiquement' })
    .setTimestamp();
}

async function postEmbed(ltdName, color) {
  const embed = generateEmbed(ltdName, color);
  await fetch(CONSO_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

// Auto commande dynamique
client.on('ready', async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
  loadData();

  const commands = [
    new SlashCommandBuilder()
      .setName('creer-embed')
      .setDescription('Crée les embeds de suivi consommation pour tous les LTD')
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log('✅ Commande slash enregistrée');

  // Archive hebdo automatique
  setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 5 && now.getHours() === 23 && now.getMinutes() === 59) {
      const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
      const thread = await channel.threads.create({
        name: `🧾 Archives - Semaine ${now.toLocaleDateString('fr-FR')}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      });

      for (const ltd of Object.values(LTD_CHANNELS)) {
        const archiveEmbed = generateEmbed(ltd.name, ltd.color);
        await thread.send({ embeds: [archiveEmbed] });
        data[ltd.name].actuel = 0;
        await postEmbed(ltd.name, ltd.color);
      }

      saveData();
    }
  }, 60000);
});

// Slash /creer-embed
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'creer-embed') return;

  if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
    return interaction.reply({ content: '❌ Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
  }

  await interaction.reply({ content: '📊 Création en cours...', ephemeral: true });

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const now = new Date();
  const thread = await channel.threads.create({
    name: `🧾 Archives - Semaine ${now.toLocaleDateString('fr-FR')}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
  });

  for (const ltd of Object.values(LTD_CHANNELS)) {
    const embed = generateEmbed(ltd.name, ltd.color);
    await thread.send({ embeds: [embed] });
    await postEmbed(ltd.name, ltd.color);
  }

  await interaction.editReply('✅ Les nouveaux embeds ont été envoyés et les anciens archivés.');
  saveData();
});

// Commandes / ajustements / dépôts
client.on('messageCreate', async (message) => {
  if (!message.embeds.length) return;
  const embed = message.embeds[0];
  const title = embed.title || '';
  const description = embed.description || '';

  // Commandes et ajustements
  if (LTD_CHANNELS[message.channelId]) {
    const ltd = LTD_CHANNELS[message.channelId];
    const ltdName = ltd.name;

    if (title.includes('🛢️ Nouvelle commande')) {
      const match = description.match(/(\\d+)\\s*bidons/i);
      if (match) {
        const bidons = parseInt(match[1]);
        data[ltdName].objectif += bidons * 15;
        await postEmbed(ltdName, ltd.color);
        saveData();
      }
    } else if (title.includes('🔧 Ajustement')) {
      const match = description.match(/(\\d+)\\s*L/i);
      if (match) {
        data[ltdName].objectif = parseInt(match[1]);
        await postEmbed(ltdName, ltd.color);
        saveData();
      }
    }
  }

  // Dépôts
  if (message.channelId === LOG_DEPOT_ID) {
    for (const ltd of Object.values(LTD_CHANNELS)) {
      if (description.includes(ltd.name)) {
        const match = description.match(/(\\d+)\\s*bidons/i);
        if (match) {
          const bidons = parseInt(match[1]);
          data[ltd.name].actuel += bidons * 15;
          await postEmbed(ltd.name, ltd.color);
          saveData();
        }
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);

