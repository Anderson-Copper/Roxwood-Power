// 📦 consommation.js (version complète avec gestion des ajustements et dépôts)
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
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  // 🔧 Ajustement
  if (message.channelId === LIAISON_AJUSTEMENT_ID && message.content.includes('Ajustement demandé')) {
    const entrepriseMatch = message.content.match(/par (LTD [^\n]+)/);
    const quantiteMatch = message.content.match(/Quantité: (\d+) Litre/);

    if (!entrepriseMatch || !quantiteMatch) return;
    const entreprise = entrepriseMatch[1];
    const objectif = parseInt(quantiteMatch[1]);
    const couleur = LTD_couleurs[entreprise];
    if (!couleur) return;

    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 50 });
    const embedMessage = messages.find(m => m.embeds[0]?.title?.includes(entreprise));
    if (!embedMessage) return;

    const oldEmbed = embedMessage.embeds[0];
    const currentVolume = oldEmbed.description.match(/Volume livré : `?(\d+) L`?/);
    const volume = currentVolume ? parseInt(currentVolume[1]) : 0;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Suivi de consommation - ${entreprise}`)
      .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`${volume} L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    await embedMessage.edit({ embeds: [embed], components: [row] });
    console.log(`✅ Objectif mis à jour pour ${entreprise} avec ${objectif}L.`);
  }

 // 🛢️ Dépôt - Embed OU texte brut par développeur
if (message.channelId === LIAISON_DEPOTS_ID) {
  let entreprise = null;
  let bidons = null;

  // Cas 1 : Embed de dépôt structuré
  if (message.embeds.length > 0) {
    const embed = message.embeds[0];
    const entrepriseLine = embed.description?.split('\n').find(line => line.includes('LTD'));
    const quantiteField = embed.fields?.find(f => f.name.toLowerCase().includes('quantité'));
    if (entrepriseLine && quantiteField) {
      entreprise = entrepriseLine.trim();
      bidons = parseInt(quantiteField.value.trim());
    }
  }

  // Cas 2 : Message texte libre par dev
  if (!bidons && message.content.includes('Dépot de produit')) {
    const lignes = message.content.split('\n');
    const ligneLTD = lignes.find(line => line.includes('LTD'));
    const ligneQuantite = lignes.find(line => line.toLowerCase().includes('quantité déposé'));

    if (ligneLTD && ligneQuantite) {
      entreprise = ligneLTD.trim();
      const match = ligneQuantite.match(/(\d+)/);
      if (match) bidons = parseInt(match[1]);
    }
  }

  if (!entreprise || isNaN(bidons)) return;
  const ajout = bidons * 15;
  const couleur = LTD_couleurs[entreprise];
  if (!couleur) return;

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });
  const embedMessage = messages.find(m => m.embeds[0]?.title?.includes(entreprise));
  if (!embedMessage) return;

  const oldEmbed = embedMessage.embeds[0];
  const volumeMatch = oldEmbed.description.match(/Volume livré : `?(\d+) L`?/);
  const objectifMatch = oldEmbed.description.match(/Objectif : `?(\d+) L`?/);
  const actuel = volumeMatch ? parseInt(volumeMatch[1]) : 0;
  const objectif = objectifMatch ? parseInt(objectifMatch[1]) : 0;

  const embedUpdate = new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${entreprise}`)
    .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`${actuel + ajout} L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
    .setColor(couleurs[couleur])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
  );

  await embedMessage.edit({ embeds: [embedUpdate], components: [row] });
  console.log(`📦 Dépôt reconnu pour ${entreprise} : ${bidons} bidons (${ajout} L).`);
}
});

client.login(process.env.DISCORD_TOKEN_PWR);

