// 📦 consommation.js (version avec détection d'embed, texte manuel et logs)
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
const LOG_CHANNEL_ID = '1375152581307007056'; // 🛢・Logs-Dépôts
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

    objectifMap[entreprise] = objectif;

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

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
    await logChannel.send(`🔧 Objectif mis à jour pour ${entreprise} → ${objectif} L`);
  }

  // 🛢️ Dépôt via texte manuel
  if (message.channelId === LIAISON_DEPOTS_ID && message.content.includes('Dépot de produit')) {
    const entrepriseMatch = message.content.match(/LTD .+/);
    const quantiteMatch = message.content.match(/Quantité déposée ?: (\d+)/);
    if (!entrepriseMatch || !quantiteMatch) return;

    const entreprise = entrepriseMatch[0];
    const ajout = parseInt(quantiteMatch[1]) * 15;
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
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : objectifMap[entreprise] ?? 0;

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
    console.log(`📥 Dépôt manuel traité pour ${entreprise} : ${ajout}L.`);

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
    await logChannel.send(`📥 Dépôt manuel détecté : ${entreprise} +${ajout} L`);
  }

  // 🛢️ Dépôt via embed
  if (message.channelId === LIAISON_DEPOTS_ID && message.embeds.length) {
    const embed = message.embeds[0];
    const entrepriseMatch = embed.title?.match(/LTD .+/);
    const quantiteMatch = embed.fields?.find(f => f.name.includes('Quantité'))?.value.match(/(\d+)/);

    if (!entrepriseMatch || !quantiteMatch) return;

    const entreprise = entrepriseMatch[0];
    const ajout = parseInt(quantiteMatch[1]) * 15;
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
    const objectif = objectifMatch ? parseInt(objectifMatch[1]) : objectifMap[entreprise] ?? 0;

    const updatedEmbed = new EmbedBuilder()
      .setTitle(`📊 Suivi de consommation - ${entreprise}`)
      .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`${actuel + ajout} L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
      .setColor(couleurs[couleur])
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    await embedMessage.edit({ embeds: [updatedEmbed], components: [row] });
    console.log(`📦 Dépôt via embed traité pour ${entreprise} : ${ajout}L.`);

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
    await logChannel.send(`📦 Dépôt embed détecté : ${entreprise} +${ajout} L`);
  }
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

    const embed = new EmbedBuilder()
      .setTitle(`📊 Suivi de consommation - ${entreprise}`)
      .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`0 L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
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
  // Évite les erreurs si l'interaction est expirée
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

