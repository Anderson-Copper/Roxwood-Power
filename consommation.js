// 📦 consommation.js (nouveau format avec barre de progression, ajustement & dépôt via embed ou texte, + archivage hebdo)
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

// les fonctions updateObjectif, updateVolume, generateProgressBar, scheduleWeeklyReset sont inchangées

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'archiver') {
    if (!interaction.member.roles.cache.has(ROLE_DEV_ID)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission.', flags: 64 });
    }

    try {
      await interaction.deferReply({ flags: 64 });

      const msg = await interaction.channel.messages.fetch(interaction.message.id);
      const thread = await interaction.channel.threads.create({
        name: `📁 Archive - ${new Date().toLocaleDateString('fr-FR')}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
      });

      await thread.send({ embeds: msg.embeds });
      await msg.delete().catch(() => {});
      await interaction.editReply({ content: '✅ Embed archivé avec succès.' }).catch(() => {});
    } catch (err) {
      console.error('❌ Erreur d’archivage :', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Erreur lors de l’archivage.', flags: 64 }).catch(() => {});
      }
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'reset-consommation') {
    if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission.', flags: 64 });
    }

    await interaction.reply({ content: '🔄 Archivage et remise à zéro en cours...', flags: 64 });
    await archiveAndResetEmbeds();
    await interaction.editReply({ content: '✅ Remise à zéro terminée.' });
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);
