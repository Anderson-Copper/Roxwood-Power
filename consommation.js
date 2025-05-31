require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThreadAutoArchiveDuration,
  ChannelType
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
const threadMap = {}; // <=== NOUVEAU : pour stocker l'ID du thread unique par LTD

function generateProgressBar(current, max, length = 20) {
  const percent = Math.min(current / max, 1);
  const filled = Math.round(percent * length);
  const empty = Math.max(length - filled, 0);
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  await loadThreads(); // Récupération des threads d’archive
  scheduleWeeklyReset();
});

async function loadThreads() {
  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const threads = await channel.threads.fetchActive();
  threads.threads.forEach(thread => {
    const match = thread.name.match(/Archive - (.+)/);
    if (match) {
      const nomLTD = match[1].trim();
      threadMap[nomLTD] = thread.id;
    }
  });
}

client.on('messageCreate', async message => {
  // Détection ajustement manuel
  if (message.channelId === LIAISON_AJUSTEMENT_ID && message.content.includes('Ajustement demandé')) {
    const entrepriseMatch = message.content.match(/par (LTD [^\n]+)/);
    const quantiteMatch = message.content.match(/Quantité: (\d+) Litre/);
    if (!entrepriseMatch || !quantiteMatch) return;
    const entreprise = entrepriseMatch[1];
    const objectif = parseInt(quantiteMatch[1]);
    return updateObjectif(entreprise, objectif, true);
  }

  // Détection log livraison via embed
  if (message.channelId === LIAISON_DEPOTS_ID && message.embeds.length > 0) {
    const embed = message.embeds[0];
    const entreprise = embed.title?.match(/LTD [^\n]+/)?.[0];
    const qtyField = embed.fields?.find(f => f.name.toLowerCase().includes('quantité'))?.value;
    if (!entreprise || !qtyField) return;
    const bidons = parseInt(qtyField);
    if (!isNaN(bidons)) return updateVolume(entreprise, bidons * 15);
  }

  // Détection via texte brut
  if (message.channelId === LIAISON_DEPOTS_ID && message.content.includes('Quantité déposé')) {
    const entreprise = message.content.match(/LTD .+/)?.[0];
    const quantite = message.content.match(/Quantité déposé\n(\d+)/)?.[1];
    if (!entreprise || !quantite) return;
    return updateVolume(entreprise, parseInt(quantite) * 15);
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
  const nextFriday = new Date();
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  nextFriday.setHours(23, 59, 0, 0);
  const delay = nextFriday.getTime() - now.getTime();
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
    const volumeMatch = desc.match(/\*\*(\d+) L\*\*/);
    const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
    const objectifMatch = desc.match(/\/ (\d+) L/);
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : 0;
    const montant = Math.round((volume / 15) * 35);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    // Nouveau embed (posté avant archive)
    const percentBar = generateProgressBar(0, objectif);
    const newEmbed = new EmbedBuilder()
      .setTitle(titre)
      .setDescription(`\n**0 L** / ${objectif} L\n${percentBar}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    await channel.send({ embeds: [newEmbed], components: [row] });

    // Envoi facture
    const liaisonId = LTD_LIAISONS[titre];
    const ltdRoleId = LTD_ROLES[titre];
    if (liaisonId) {
      const liaisonChannel = await client.channels.fetch(liaisonId);
      await liaisonChannel.send({
        content: `<@&${ROLE_ADMIN_ID}>${ltdRoleId ? ` <@&${ltdRoleId}>` : ''} • ${titre} a consommé **${volume} L** cette semaine.\n💰 Facture : **${montant.toLocaleString()}$** (35$ par bidon de 15L)`
      });
    }

    // ARCHIVAGE : dans thread unique
    let thread = null;
    const threadId = threadMap[titre];
    if (threadId) {
      thread = await channel.threads.fetch(threadId).catch(() => null);
    }

    if (!thread || thread.archived) {
      thread = await channel.threads.create({
        name: `📁 Archive - ${titre}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        type: ChannelType.PublicThread
      });
      threadMap[titre] = thread.id;
    }

    await thread.send({ embeds: [embed] });
    await msg.delete().catch(() => {});
    console.log(`🗂 ${titre} archivé et nouveau embed posté.`);
  }
}

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'archiver') {
    if (!interaction.member.roles.cache.has(ROLE_DEV_ID)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission d’archiver ce message.', ephemeral: true });
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const msg = await interaction.channel.messages.fetch(interaction.message.id);
      const embed = msg.embeds[0];
      const titre = embed?.title;
      const desc = embed?.description || '';
      const volume = parseInt(desc.match(/\*\*(\d+) L\*\*/)?.[1] || '0');
      const montant = Math.round((volume / 15) * 35);

      // facture
      const liaisonId = LTD_LIAISONS[titre];
      const ltdRoleId = LTD_ROLES[titre];
      if (liaisonId) {
        const liaisonChannel = await client.channels.fetch(liaisonId);
        await liaisonChannel.send({
          content: `<@&${ROLE_ADMIN_ID}>${ltdRoleId ? ` <@&${ltdRoleId}>` : ''} • ${titre} a consommé **${volume} L** cette semaine.\n💰 Facture : **${montant.toLocaleString()}$** (35$ par bidon de 15L)`
        });
      }

      // thread unique
      const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
      let thread = null;
      const threadId = threadMap[titre];
      if (threadId) {
        thread = await channel.threads.fetch(threadId).catch(() => null);
      }
      if (!thread || thread.archived) {
        thread = await channel.threads.create({
          name: `📁 Archive - ${titre}`,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
        });
        threadMap[titre] = thread.id;
      }

      await thread.send({ embeds: [embed] });
      await msg.delete().catch(() => {});
      await interaction.editReply({ content: '✅ Embed archivé avec succès.' });
    } catch (e) {
      console.error('Erreur archivage :', e);
      await interaction.editReply({ content: '❌ Erreur pendant l’archivage.' });
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'creer-embed') {
    if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission.', ephemeral: true });
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
    await interaction.reply({ content: `✅ Embed créé pour ${entreprise}`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);
