// 📦 consommation.js (nouveau format avec barre de progression, ajustement & dépôt via embed ou texte)
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThreadAutoArchiveDuration
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

const LTD_CHANNELS = {
  'LTD Grove Street': '1375406833212194856',
  'LTD Little Seoul': '1375407141166518272',
  'LTD Sandy Shores': '1375407195415511060',
  'LTD Roxwood': '1375407362004750366'
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

const objectifMap = {}; // 🔁 Mémoire locale des objectifs

function generateProgressBar(current, max, length = 20) {
  const percent = Math.min(current / max, 1);
  const filled = Math.round(percent * length);
  const empty = Math.max(length - filled, 0);
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  // 🔧 Ajustement manuel
  if (message.channelId === LIAISON_AJUSTEMENT_ID && message.content.includes('Ajustement demandé')) {
    const entrepriseMatch = message.content.match(/par (LTD [^\n]+)/);
    const quantiteMatch = message.content.match(/Quantité: (\d+) Litre/);
    if (!entrepriseMatch || !quantiteMatch) return;

    const entreprise = entrepriseMatch[1];
    const objectif = parseInt(quantiteMatch[1]);
    return updateObjectif(entreprise, objectif, true);
  }

  // 🔧 Ajustement via commande urgente (liaison LTD) → AJOUT à l’objectif existant
  for (const [entreprise, channelId] of Object.entries(LTD_CHANNELS)) {
    if (message.channelId === channelId && message.embeds.length > 0) {
      const embed = message.embeds[0];
      if (embed.title?.includes('Nouvelle Commande')) {
        const qtyField = embed.fields?.find(f => f.name.includes('Quantité de Bidon'));
        if (!qtyField) return;
        const nbBidons = parseInt(qtyField.value);
        const ajoutObjectif = nbBidons * 15;
        return updateObjectif(entreprise, ajoutObjectif, false); // false = on ajoute au lieu de remplacer
      }
    }
  }

  // 🛢️ Détection dépôt manuel texte
  if (message.channelId === LIAISON_DEPOTS_ID && message.content.includes('Quantité déposé')) {
    const entrepriseMatch = message.content.match(/LTD .+/);
    const quantiteMatch = message.content.match(/Quantité déposé\n(\d+)/);
    if (!entrepriseMatch || !quantiteMatch) return;

    const entreprise = entrepriseMatch[0];
    const ajout = parseInt(quantiteMatch[1]) * 15;
    return updateVolume(entreprise, ajout);
  }

  // 🛢️ Détection dépôt via embed
  if (message.channelId === LIAISON_DEPOTS_ID && message.embeds.length > 0) {
    const embed = message.embeds[0];
    const entrepriseMatch = embed.title?.match(/LTD .+/);
    const qtyField = embed.fields?.find(f => f.name.toLowerCase().includes('quantité'))?.value;
    if (!entrepriseMatch || !qtyField) return;

    const entreprise = entrepriseMatch[0];
    const bidons = parseInt(qtyField);
    if (isNaN(bidons)) return;

    return updateVolume(entreprise, bidons * 15);
  }
});

async function updateObjectif(entreprise, valeur, remplacer = true) {
  const couleur = LTD_couleurs[entreprise];
  if (!couleur) return;

  const actuel = objectifMap[entreprise] ?? 0;
  const objectif = remplacer ? valeur : actuel + valeur;
  objectifMap[entreprise] = objectif;

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });
  const embedMessage = messages.find(m => m.embeds[0]?.title === entreprise);
  if (!embedMessage) return;

  const oldEmbed = embedMessage.embeds[0];
  const desc = oldEmbed.description || '';
  const volumeMatch = desc.match(/\*\*(\d+) L\*\*/);
  const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
  const percentBar = generateProgressBar(volume, objectif);

  const embed = new EmbedBuilder()
    .setTitle(entreprise)
    .setDescription(`\n**${volume} L** / ${objectif} L\n${percentBar}`)
    .setColor(couleurs[couleur])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
  );

  await embedMessage.edit({ embeds: [embed], components: [row] });
  console.log(`✅ Objectif ${remplacer ? 'défini' : 'ajouté'} pour ${entreprise} → ${objectif}L.`);
}

async function updateVolume(entreprise, ajout) {
  const couleur = LTD_couleurs[entreprise];
  if (!couleur) return;

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });
  const embedMessage = messages.find(m => m.embeds[0]?.title === entreprise);
  if (!embedMessage) return;

  const oldEmbed = embedMessage.embeds[0];
  const desc = oldEmbed.description || '';
  const volumeMatch = desc.match(/\*\*(\d+) L\*\*/);
  const objectifMatch = desc.match(/\/ (\d+) L/);
  const actuel = volumeMatch ? parseInt(volumeMatch[1]) : 0;
  const objectif = objectifMatch ? parseInt(objectifMatch[1]) : objectifMap[entreprise] ?? 0;

  const nouveauVolume = actuel + ajout;
  const percentBar = generateProgressBar(nouveauVolume, objectif);

  const embed = new EmbedBuilder()
    .setTitle(entreprise)
    .setDescription(`\n**${nouveauVolume} L** / ${objectif} L\n${percentBar}`)
    .setColor(couleurs[couleur])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
  );

  await embedMessage.edit({ embeds: [embed], components: [row] });
  console.log(`📦 Volume mis à jour pour ${entreprise} : +${ajout}L → Total ${nouveauVolume}L.`);
}

client.login(process.env.DISCORD_TOKEN_PWR);
