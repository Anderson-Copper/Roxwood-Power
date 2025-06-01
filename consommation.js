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
const ROLE_DEV_ID = '1374863891296682185';

const LTD_CHANNELS = {
  'LTD Grove Street': '1375406833212194856',
  'LTD Little Seoul': '1375407141166518272',
  'LTD Sandy Shores': '1375407195415511060',
  'LTD Roxwood': '1375407362004750366'
};

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

// Stocke les objectifs en mémoire
const objectifMap = {};
// Stocke les threads d'archive pour chaque LTD
const archiveThreadMap = {};

function generateProgressBar(current, max, length = 20) {
  const percent = Math.min(current / max, 1);
  const filled = Math.round(percent * length);
  const empty = Math.max(length - filled, 0);
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  scheduleWeeklyReset();
});

// --- Gestion des messages ---

client.on('messageCreate', async message => {
  // Ajustement demandé
  if (message.channelId === LIAISON_AJUSTEMENT_ID && message.content.includes('Ajustement demandé')) {
    const entrepriseMatch = message.content.match(/par (LTD [^\n]+)/);
    const quantiteMatch = message.content.match(/Quantité: (\d+) Litre/);
    if (!entrepriseMatch || !quantiteMatch) return;
    const entreprise = entrepriseMatch[1];
    const objectif = parseInt(quantiteMatch[1]);
    return updateObjectif(entreprise, objectif, true);
  }

  // Nouvelle commande
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

  // Dépôt via message texte
  if (message.channelId === LIAISON_DEPOTS_ID && message.content.includes('Quantité déposé')) {
    const entrepriseMatch = message.content.match(/LTD .+/);
    const quantiteMatch = message.content.match(/Quantité déposé\n(\d+)/);
    if (!entrepriseMatch || !quantiteMatch) return;
    const entreprise = entrepriseMatch[0];
    const ajout = parseInt(quantiteMatch[1]) * 15;
    return updateVolume(entreprise, ajout);
  }

  // Dépôt via embed
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

// --- Fonctions principales ---

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
  objectifMap[entreprise] = objectif;

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
  // Test: Reset aujourd'hui à 16h08 (heure du serveur)
  const resetTime = new Date(now);
  resetTime.setHours(14, 8, 0, 0);

  if (resetTime < now) resetTime.setDate(resetTime.getDate() + 1); // Si déjà passé aujourd'hui, décale à demain
  const delay = resetTime.getTime() - now.getTime();

  console.log(`⏳ Réinitialisation planifiée dans ${Math.round(delay / 1000)} secondes.`);
  setTimeout(() => {
    archiveAndResetEmbeds();
    setInterval(archiveAndResetEmbeds, 7 * 24 * 60 * 60 * 1000);
  }, delay);
}

// Récupère ou crée le thread d’archive pour un LTD
async function getOrCreateArchiveThread(channel, entreprise) {
  if (archiveThreadMap[entreprise]) {
    try {
      const thread = await channel.threads.fetch(archiveThreadMap[entreprise]);
      if (thread) return thread;
    } catch (e) {
      // Thread supprimé ou expiré, on continue
    }
  }
  // Sinon, cherche un thread existant par nom
  const threads = await channel.threads.fetchActive();
  let thread = threads.threads.find(t => t.name === `📁 Archive - ${entreprise}`);
  if (!thread) {
    thread = await channel.threads.create({
      name: `📁 Archive - ${entreprise}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
    });
  }
  archiveThreadMap[entreprise] = thread.id;
  return thread;
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
    const volumeMatch = desc.match(/\*\*(\d+) L\*\*/);
    const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
    const objectifMatch = desc.match(/\/ (\d+) L/);
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : objectifMap[titre] ?? 0;
    objectifMap[titre] = objectif;

    // ENVOI FACTURE DANS LA LIAISON DU LTD
    const montant = Math.round((volume / 15) * 35);
    const liaisonId = LTD_LIAISONS[titre];
    const ltdRoleId = LTD_ROLES[titre];
    if (liaisonId) {
      const liaisonChannel = await client.channels.fetch(liaisonId);
      await liaisonChannel.send({
        content: `<@&${ROLE_ADMIN_ID}>${ltdRoleId ? ` <@&${ltdRoleId}>` : ''} • ${titre} a consommé **${volume} L** cette semaine.\n💰 Facture : **${montant.toLocaleString()}$** (35$ par bidon de 15L)`
      });
    }

    // ARCHIVE: thread unique
    const thread = await getOrCreateArchiveThread(channel, titre);
    await thread.send({ embeds: [embed] });

    // RESET EMBED PRINCIPAL
    const percentBar = generateProgressBar(0, objectif);
    const newEmbed = new EmbedBuilder()
      .setTitle(titre)
      .setDescription(`\n**0 L** / ${objectif} L\n${percentBar}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    await msg.edit({ embeds: [newEmbed], components: [row] });
    console.log(`🗂 Archivé & remis à zéro : ${titre}`);
  }
}

// --- Gestion des interactions ---

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'archiver') {
    if (!interaction.member.roles.cache.has(ROLE_DEV_ID)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission d’archiver ce message.', flags: 64 }).catch(() => {});
    }

    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: 64 }).catch(() => {});
      }

      const msg = await interaction.channel.messages.fetch(interaction.message.id);
      const embed = msg.embeds[0];
      const titre = embed?.title;
      const desc = embed?.description || '';
      const volumeMatch = desc.match(/\*\*(\d+) L\*\*/);
      const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
      const montant = Math.round((volume / 15) * 35);

      // Facture
      const liaisonId = LTD_LIAISONS[titre];
      const ltdRoleId = LTD_ROLES[titre];
      if (liaisonId) {
        const liaisonChannel = await client.channels.fetch(liaisonId);
        await liaisonChannel.send({
          content: `<@&${ROLE_ADMIN_ID}>${ltdRoleId ? ` <@&${ltdRoleId}>` : ''} • ${titre} a consommé **${volume} L** cette semaine.\n💰 Facture : **${montant.toLocaleString()}$** (35$ par bidon de 15L)`
        });
      }

      // ARCHIVE : thread unique
      const consoChannel = await client.channels.fetch(CONSO_CHANNEL_ID);
      const thread = await getOrCreateArchiveThread(consoChannel, titre);
      await thread.send({ embeds: [embed] });

      await msg.delete().catch(() => {});
      await interaction.editReply({ content: '✅ Embed archivé avec succès.' }).catch(() => {});
    } catch (err) {
      console.error('❌ Erreur d’archivage :', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Erreur lors de l’archivage.', flags: 64 }).catch(() => {});
      }
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'creer-embed') {
    if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission.', flags: 64 });
    }

    const entreprise = interaction.options.getString('entreprise');
    const couleur = interaction.options.getString('couleur');
    const objectif = interaction.options.getInteger('objectif_litre');

    objectifMap[entreprise] = objectif;
    const percentBar = generateProgressBar(0, objectif);

    const embed = new EmbedBuilder()
      .setTitle(entreprise)
      .setDescription(`\n**0 L** / ${objectif} L\n${percentBar}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Embed créé pour ${entreprise}`, flags: 64 });
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);


