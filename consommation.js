// 📦 consommation.js (nouveau format avec barre de progression)
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
const CONSO_CHANNEL_ID = '1374906428418031626';
const ROLE_ADMIN_ID = '1375058990152548372';

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
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.channelId !== LIAISON_AJUSTEMENT_ID) return;
  if (!message.content.includes('Ajustement demandé')) return;

  const entrepriseMatch = message.content.match(/par (LTD [^\n]+)/);
  const quantiteMatch = message.content.match(/Quantité: (\d+) Litre/);
  if (!entrepriseMatch || !quantiteMatch) return;

  const entreprise = entrepriseMatch[1];
  const objectif = parseInt(quantiteMatch[1]);
  const couleur = LTD_couleurs[entreprise];
  if (!couleur) return;

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
  console.log(`✅ Objectif mis à jour pour ${entreprise} avec ${objectif}L.`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'creer-embed') {
    if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
      return interaction.reply({ content: 'Tu n’as pas la permission.', flags: 64 });
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
    await interaction.reply({ content: `Embed créé pour ${entreprise}`, flags: 64 });
  }

  if (interaction.isButton() && interaction.customId === 'archiver') {
    if (interaction.replied || interaction.deferred) return;

    try {
      await interaction.deferReply({ flags: 64 }).catch(() => {});

      const msg = await interaction.channel.messages.fetch(interaction.message.id);
      const archiveThread = await interaction.channel.threads.create({
        name: `📁 Archive - ${new Date().toLocaleDateString('fr-FR')}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
      });

      await archiveThread.send({ embeds: msg.embeds });
      await msg.delete().catch(() => {});
      await interaction.editReply({ content: 'Embed archivé avec succès.' }).catch(() => {});
    } catch (err) {
      console.error('❌ Erreur d’archivage :', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Erreur lors de l’archivage.', flags: 64 }).catch(() => {});
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);

