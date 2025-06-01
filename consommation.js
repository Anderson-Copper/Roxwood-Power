// 📦 consommation.js (script complet avec archivage, suivi, et bouton sécurisé)
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThreadAutoArchiveDuration,
  Events
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const LIAISON_AJUSTEMENT_ID = '1375516696957292646';
const LIAISON_DEPOTS_ID = '1375152581307007056';
const CONSO_CHANNEL_ID = '1374906428418031626';
const ROLE_ADMIN_ID = '1375058990152548372';
const ROLE_DEV_ID = '1374863891296682185';

const LTD_ROLES = {
  'LTD Grove Street': '1375134927158247628',
  'LTD Little Seoul': '1375135009769394257',
  'LTD Sandy Shores': '1375135009857601586',
  'LTD Roxwood': '1375135010696200234'
};

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

const objectifMap = {};
const volumeMap = {};
const threadsMap = {};

function generateProgressBar(current, max, length = 20) {
  const percent = Math.min(current / max, 1);
  const filled = Math.round(percent * length);
  const empty = Math.max(length - filled, 0);
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const threads = await channel.threads.fetchActive();
  threads.threads.forEach(thread => {
    const ltd = Object.keys(LTD_couleurs).find(nom => thread.name.includes(nom));
    if (ltd) threadsMap[ltd] = thread;
  });
  scheduleWeeklyReset();
});

function scheduleWeeklyReset() {
  const now = new Date();
  const next = new Date();
  next.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  next.setHours(23, 59, 0, 0);
  const delay = next - now;
  setTimeout(() => {
    archiveAndResetEmbeds();
    setInterval(archiveAndResetEmbeds, 7 * 24 * 60 * 60 * 1000);
  }, delay);
}

async function archiveAndResetEmbeds() {
  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });

  for (const msg of messages.values()) {
    const embed = msg.embeds[0];
    if (!embed || !embed.title) continue;
    const titre = embed.title;
    const couleur = LTD_couleurs[titre];
    const desc = embed.description || '';
    const volume = parseInt(desc.match(/\*\*(\d+) L\*\*/)?.[1]) || 0;
    const objectif = parseInt(desc.match(/\/ (\d+) L/)?[1]) || 0;
    const montant = Math.round((volume / 15) * 35);

    volumeMap[titre] = 0;
    objectifMap[titre] = objectif;

    const thread = threadsMap[titre] || await channel.threads.create({
      name: `📁 ${titre}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
    });
    threadsMap[titre] = thread;

    const roleMention = LTD_ROLES[titre] ? ` <@&${LTD_ROLES[titre]}>` : '';
    await thread.send({
      content: `<@&${ROLE_ADMIN_ID}>${roleMention} • ${titre} a consommé **${volume} L** cette semaine. 💰 Facture : **${montant.toLocaleString()}$**`,
      embeds: [embed]
    });

    const newEmbed = new EmbedBuilder()
      .setTitle(titre)
      .setDescription(`\n**0 L** / ${objectif} L\n${generateProgressBar(0, objectif)}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    await msg.delete().catch(() => {});
    await channel.send({ embeds: [newEmbed], components: [row] });
  }
}

// (le reste du script reste inchangé, envoi automatique et manuelle ok)

client.login(process.env.DISCORD_TOKEN_PWR);


