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

const objectifMap = {};

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
        const ajout = nbBidons * 15;
        return updateObjectif(entreprise, ajout, false);
      }
    }
  }

  if (message.channelId === LIAISON_DEPOTS_ID && message.embeds.length > 0) {
    const embed = message.embeds[0];
    const entrepriseMatch = embed.title?.match(/LTD .+/);
    const qty = embed.fields?.find(f => f.name.toLowerCase().includes('quantité'))?.value;
    if (!entrepriseMatch || !qty) return;
    const entreprise = entrepriseMatch[0];
    const bidons = parseInt(qty);
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

  const old = embedMessage.embeds[0];
  const volumeMatch = old.description?.match(/\*\*(\d+) L\*\*/);
  const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
  const bar = generateProgressBar(volume, objectif);

  const embed = new EmbedBuilder()
    .setTitle(entreprise)
    .setDescription(`\n**${volume} L** / ${objectif} L\n${bar}`)
    .setColor(couleurs[couleur])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
  );

  await embedMessage.edit({ embeds: [embed], components: [row] });
}

async function updateVolume(entreprise, ajout) {
  const couleur = LTD_couleurs[entreprise];
  if (!couleur) return;

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });
  const msg = messages.find(m => m.embeds[0]?.title === entreprise);
  if (!msg) return;

  const old = msg.embeds[0];
  const volumeMatch = old.description?.match(/\*\*(\d+) L\*\*/);
  const objectifMatch = old.description?.match(/\/ (\d+) L/);
  const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
  const objectif = objectifMatch ? parseInt(objectifMatch[1]) : objectifMap[entreprise] ?? 0;

  const nouveau = volume + ajout;
  const bar = generateProgressBar(nouveau, objectif);

  const embed = new EmbedBuilder()
    .setTitle(entreprise)
    .setDescription(`\n**${nouveau} L** / ${objectif} L\n${bar}`)
    .setColor(couleurs[couleur])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
  );

  await msg.edit({ embeds: [embed], components: [row] });
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
    const montant = Math.round((volume / 15) * 35);
    const objectifMatch = desc.match(/\/ (\d+) L/);
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : 0;

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

    await channel.send({ embeds: [newEmbed], components: [row] });

    const liaison = await client.channels.fetch(LTD_LIAISONS[titre]);
    if (liaison) {
      await liaison.send({
        content: `<@&${ROLE_ADMIN_ID}> <@&${LTD_ROLES[titre]}> • ${titre} a consommé **${volume} L** cette semaine.\n💰 Facture : **${montant.toLocaleString()}$**`
      });
    }

    const thread = await channel.threads.create({
      name: `📁 Archive - ${titre} - ${new Date().toLocaleDateString('fr-FR')}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
    });

    await thread.send({ embeds: [embed] });
    await msg.delete().catch(() => {});
  }
}

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'archiver') {
    if (!interaction.member.roles.cache.has(ROLE_DEV_ID)) {
      return interaction.reply({ content: '❌ Pas la permission.', flags: 64 }).catch(() => {});
    }

    await interaction.deferReply({ flags: 64 }).catch(() => {});
    const msg = await interaction.channel.messages.fetch(interaction.message.id);
    const embed = msg.embeds[0];
    const titre = embed.title;
    const desc = embed.description || '';
    const volumeMatch = desc.match(/\*\*(\d+) L\*\*/);
    const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
    const montant = Math.round((volume / 15) * 35);
    const objectifMatch = desc.match(/\/ (\d+) L/);
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : 0;
    const couleur = LTD_couleurs[titre];

    const newEmbed = new EmbedBuilder()
      .setTitle(titre)
      .setDescription(`\n**0 L** / ${objectif} L\n${generateProgressBar(0, objectif)}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({ embeds: [newEmbed], components: [row] });

    const liaison = await client.channels.fetch(LTD_LIAISONS[titre]);
    if (liaison) {
      await liaison.send({
        content: `<@&${ROLE_ADMIN_ID}> <@&${LTD_ROLES[titre]}> • ${titre} a consommé **${volume} L** cette semaine.\n💰 Facture : **${montant.toLocaleString()}$**`
      });
    }

    const thread = await interaction.channel.threads.create({
      name: `📁 Archive - ${titre} - ${new Date().toLocaleDateString('fr-FR')}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
    });

    await thread.send({ embeds: [embed] });
    await msg.delete().catch(() => {});
    await interaction.editReply({ content: `✅ ${titre} archivé.` }).catch(() => {});
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
