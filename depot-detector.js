// 📦 depot-detector.js (nouveau script indépendant pour mise à jour du volume livré)
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

client.once('ready', () => {
  console.log('🧪 Bot dépôt prêt :', client.user.tag);
});

client.on('messageCreate', async message => {
  if (message.channelId !== DEPOT_CHANNEL_ID) return;

  const content = message.content;

  // 🔍 Recherche de l'entreprise et de la quantité
  const entrepriseMatch = content.match(/LTD [^\n]+/);
  const quantiteMatch = content.match(/Quantité déposée ?: (\d+)/);

  if (!entrepriseMatch || !quantiteMatch) return;
  const entreprise = entrepriseMatch[0];
  const bidons = parseInt(quantiteMatch[1]);
  const ajout = bidons * 15;
  const couleur = LTD_couleurs[entreprise];

  if (!couleur) return;

  const consoChannel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await consoChannel.messages.fetch({ limit: 50 });
  const embedMessage = messages.find(m => m.embeds[0]?.title?.includes(entreprise));
  if (!embedMessage) return;

  const oldEmbed = embedMessage.embeds[0];
  const volumeMatch = oldEmbed.description.match(/Volume livré : `?(\d+) L`?/);
  const objectifMatch = oldEmbed.description.match(/Objectif : `?(\d+) L`?/);

  const actuel = volumeMatch ? parseInt(volumeMatch[1]) : 0;
  const objectif = objectifMatch ? parseInt(objectifMatch[1]) : 0;
  const total = actuel + ajout;

  const updatedEmbed = new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${entreprise}`)
    .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`${total} L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
    .setColor(couleurs[couleur])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
  );

  await embedMessage.edit({ embeds: [updatedEmbed], components: [row] });
  console.log(`✅ Volume mis à jour pour ${entreprise} : +${ajout}L`);
});

client.login(process.env.DISCORD_TOKEN_PWR);
