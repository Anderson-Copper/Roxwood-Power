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

const objectifMap = {}; // 🔁 Mémoire locale des objectifs par LTD

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

    objectifMap[entreprise] = objectif; // 🧠 Mémorise l’objectif

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

  // 🛢️ Dépôt
  if (message.channelId === LIAISON_DEPOTS_ID && message.content.includes('Livraison de')) {
    const entrepriseMatch = message.content.match(/pour (LTD [^\n]+)/);
    const bidonsMatch = message.content.match(/Livraison de (\d+) bidon/);
    if (!entrepriseMatch || !bidonsMatch) return;

    const entreprise = entrepriseMatch[1];
    const ajout = parseInt(bidonsMatch[1]) * 15;

    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 50 });
    const embedMessage = messages.find(m => m.embeds[0]?.title?.includes(entreprise));
    if (!embedMessage) return;

    const oldEmbed = embedMessage.embeds[0];
    const volumeMatch = oldEmbed.description.match(/Volume livré : `?(\d+) L`?/);
    const objectifMatch = oldEmbed.description.match(/Objectif : `?(\d+) L`?/);
    const actuel = volumeMatch ? parseInt(volumeMatch[1]) : 0;
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : objectifMap[entreprise] ?? 0;
    const couleur = LTD_couleurs[entreprise];

    const embed = new EmbedBuilder()
      .setTitle(`📊 Suivi de consommation - ${entreprise}`)
      .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`${actuel + ajout} L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    await embedMessage.edit({ embeds: [embed], components: [row] });
    console.log(`📦 Dépôt ajouté pour ${entreprise} : ${ajout}L.`);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'creer-embed') return;

  if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
    return interaction.reply({ content: 'Tu n’as pas la permission.', ephemeral: true });
  }

  const entreprise = interaction.options.getString('entreprise');
  const couleur = interaction.options.getString('couleur');
  const objectif = interaction.options.getInteger('objectif_litre');

  objectifMap[entreprise] = objectif;

  const embed = new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${entreprise}`)
    .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`0 L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
    .setColor(couleurs[couleur])
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('archiver')
      .setLabel('🗂 Archiver')
      .setStyle(ButtonStyle.Secondary)
  );

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  await channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `Embed créé pour ${entreprise}`, ephemeral: true });
});

client.login(process.env.DISCORD_TOKEN_PWR);


