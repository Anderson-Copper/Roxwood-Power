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

const LTD_LIAISONS = {
  'LTD Grove Street': '1375408011605966868',
  'LTD Little Seoul': '1375408193064403044',
  'LTD Sandy Shores': '1375408305110781982',
  'LTD Roxwood': '1375408461172445214'
};

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

client.on('messageCreate', async message => {
  if (message.channelId === LIAISON_AJUSTEMENT_ID && message.content.includes('Ajustement demandé')) {
    const entrepriseMatch = message.content.match(/par (LTD [^\n]+)/);
    const quantiteMatch = message.content.match(/Quantité: (\d+) Litre/);
    if (!entrepriseMatch || !quantiteMatch) return;
    const entreprise = entrepriseMatch[1];
    const objectif = parseInt(quantiteMatch[1]);
    return updateObjectif(entreprise, objectif, true);
  }

  for (const [entreprise, channelId] of Object.entries(LTD_CHANNELS)) {
    if (message.channelId === channelId && message.embeds.length > 0) {
      const embed = message.embeds[0];
      if (embed.title?.includes('Nouvelle Commande')) {
        const qtyField = embed.fields?.find(f => f.name.includes('Quantité de Bidon'));
        if (!qtyField) return;
        const nbBidons = parseInt(qtyField.value);
        const ajoutObjectif = nbBidons * 15;
        return updateObjectif(entreprise, ajoutObjectif, false);
      }
    }
  }

  if (message.channelId === LIAISON_DEPOTS_ID && message.content.includes('Quantité déposé')) {
    const entrepriseMatch = message.content.match(/LTD .+/);
    const quantiteMatch = message.content.match(/Quantité déposé\n(\d+)/);
    if (!entrepriseMatch || !quantiteMatch) return;
    const entreprise = entrepriseMatch[0];
    const ajout = parseInt(quantiteMatch[1]) * 15;
    return updateVolume(entreprise, ajout);
  }

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
    const objectif = parseInt(desc.match(/\/ (\d+) L/)?.[1]) || 0;
    const montant = Math.round((volume / 15) * 35);

    volumeMap[titre] = 0;
    objectifMap[titre] = objectif;

    const thread = threadsMap[titre] || await channel.threads.create({
      name: `📁 ${titre}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
    });
    threadsMap[titre] = thread;

    await thread.send({
      content: `<@&${ROLE_ADMIN_ID}> • ${titre} a consommé **${volume} L** cette semaine. 💰 Facture : **${montant.toLocaleString()}$**`,
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

client.on(Events.MessageCreate, async message => {
  if (message.channelId === LIAISON_AJUSTEMENT_ID && message.content.includes('Ajustement demandé')) {
    const entrepriseMatch = message.content.match(/par (LTD [^\n]+)/);
    const quantiteMatch = message.content.match(/Quantité: (\d+) Litre/);
    if (!entrepriseMatch || !quantiteMatch) return;
    const entreprise = entrepriseMatch[1];
    const objectif = parseInt(quantiteMatch[1]);
    objectifMap[entreprise] = objectif;
  }

  if (message.channelId !== LIAISON_DEPOTS_ID) return;
  const embed = message.embeds[0];
  if (!embed || !embed.title) return;

  const titre = embed.title;
  const qtyField = embed.fields.find(f => f.name.toLowerCase().includes('quantité'));
  const bidons = qtyField ? parseInt(qtyField.value) : 0;
  if (!titre || isNaN(bidons)) return;

  const ajout = bidons * 15;
  volumeMap[titre] = (volumeMap[titre] || 0) + ajout;
  const objectif = objectifMap[titre] || 0;
  const newEmbed = new EmbedBuilder()
    .setTitle(titre)
    .setDescription(`\n**${volumeMap[titre]} L** / ${objectif} L\n${generateProgressBar(volumeMap[titre], objectif)}`)
    .setColor(couleurs[LTD_couleurs[titre]])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });
  const msg = messages.find(m => m.embeds[0]?.title === titre);
  if (!msg) return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
  );
  await msg.edit({ embeds: [newEmbed], components: [row] });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== 'archiver') return;
  if (!interaction.member.roles.cache.has(ROLE_DEV_ID)) {
    return interaction.reply({ content: '❌ Tu n’as pas la permission.', flags: 64 });
  }

  await interaction.deferReply({ flags: 64 }).catch(() => {});
  archiveAndResetEmbeds();
  interaction.editReply({ content: '✅ Archivage manuel effectué.' }).catch(() => {});
});

client.login(process.env.DISCORD_TOKEN_PWR);

