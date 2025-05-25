// 📦 depot-detector.js (nouvelle version avec barre de progression)
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DEPOT_CHANNEL_ID = '1375152581307007056';
const CONSO_CHANNEL_ID = '1374906428418031626';

const couleurs = {
  rouge: 0xFF0000,
  orange: 0xFFA500,
  vert: 0x00FF00,
  bleu: 0x0099FF
};

const LTD_couleurs = {
  'LTD Grove Street': 'rouge',
  'LTD Sandy Shores': 'orange',
  'LTD Little Seoul': 'vert',
  'LTD Roxwood': 'bleu'
};

const objectifMap = {}; // Mémoire persistante locale pour éviter l'écrasement
const volumeMap = {}; // Pour stocker volume livré par LTD

function generateProgressBar(current, max, length = 20) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

client.once('ready', () => {
  console.log('🧪 Bot dépôt prêt :', client.user.tag);
});

client.on('messageCreate', async message => {
  if (message.channelId !== DEPOT_CHANNEL_ID) return;
  if (message.content.trim() !== '1') return;

  const consoChannel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await consoChannel.messages.fetch({ limit: 50 });

  for (const entreprise in LTD_couleurs) {
    const embedMessage = messages.find(m => m.embeds[0]?.title === entreprise);
    if (!embedMessage) continue;

    const oldEmbed = embedMessage.embeds[0];
    const desc = oldEmbed.description || '';
    const match = desc.match(/\*\*(\\d+) L\*\*/);
    const objectifMatch = desc.match(/\/ (\\d+) L/);

    const actuel = match ? parseInt(match[1]) : 0;
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : (objectifMap[entreprise] ?? 0);

    objectifMap[entreprise] = objectif;
    const total = actuel + 15;
    volumeMap[entreprise] = total;

    const percentBar = generateProgressBar(total, objectif);
    const couleur = LTD_couleurs[entreprise];

    const updatedEmbed = new EmbedBuilder()
      .setTitle(entreprise)
      .setDescription(`\n**${total} L** / ${objectif} L\n${percentBar}`)
      .setColor(couleurs[couleur])
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    await embedMessage.edit({ embeds: [updatedEmbed], components: [row] });
    console.log(`✅ Volume mis à jour pour ${entreprise} : +15L → Total ${total}L (objectif conservé à ${objectif}L)`);
    break;
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);


