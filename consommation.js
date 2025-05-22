const { Client, GatewayIntentBits, EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'creer-embed') {
    await interaction.reply({ content: '📊 Création des embeds en cours...', ephemeral: true });

    for (const ltd of Object.values(LTD_CHANNELS)) {
      const embed = generateEmbed(ltd.name, ltd.color);
      await fetch(CONSO_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
    }

    await interaction.editReply('✅ Les embeds des LTD ont été postés dans 📉・𝐂𝐨𝐧𝐬𝐨𝐦𝐦𝐚𝐭𝐢𝐨𝐧.');
  }
});

// Configuration des LTD
const LTD_CHANNELS = {
  '1375134527118381066': { name: 'Grove Street', color: 0xFF0000 },
  '1375134545275523243': { name: 'Little Seoul', color: 0x00FF00 },
  '1375134573314445422': { name: 'Sandy Shores', color: 0xFFA500 },
  '1375134589189754940': { name: 'Roxwood', color: 0x0099FF },
};

const CONSO_CHANNEL_ID = '1374906428418031626';
const CONSO_WEBHOOK = 'https://discord.com/api/webhooks/1375161041876680847/kqrCZQpOs2J8atEFCIwXSt4dBtsY7zUqE_wkZiCfp4ceCWoFUD5nXJeyTxq7mNXFOgrg';
const LOG_DEPOT_ID = '1375153166424866867';

const DATA_FILE = './data.json';
let data = {};

// Charger les données sauvegardées
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

// Sauvegarder les données
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Créer un embed de suivi
function generateEmbed(ltdName, color) {
  return new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${ltdName}`)
    .setDescription(`🔋 Remplissage : **${data[ltdName].actuel}L / ${data[ltdName].objectif}L**`)
    .setColor(color)
    .setFooter({ text: 'Mis à jour automatiquement' })
    .setTimestamp();
}

// Poster un embed à jour
async function postEmbed(ltdName, color) {
  const embed = generateEmbed(ltdName, color);
  await fetch(CONSO_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  loadData();

  // Vérifie toutes les minutes si c’est vendredi 23h59
  setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 5 && now.getHours() === 23 && now.getMinutes() === 59) {
      const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
      const thread = await channel.threads.create({
        name: `Archives - Semaine ${now.toLocaleDateString('fr-FR')}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      });

      for (const [_, ltd] of Object.entries(LTD_CHANNELS)) {
        const ltdName = ltd.name;
        const archiveEmbed = generateEmbed(ltdName, ltd.color);
        await thread.send({ embeds: [archiveEmbed] });
        data[ltdName].actuel = 0;
        await postEmbed(ltdName, ltd.color);
      }

      saveData();
    }
  }, 60 * 1000);
});

client.on('messageCreate', async (message) => {
  if (!message.embeds.length) return;
  const embed = message.embeds[0];
  const title = embed.title || '';
  const description = embed.description || '';

  // Commande ou ajustement dans un salon LTD
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

  // Dépôt dans LOG_DEPOT_ID
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
