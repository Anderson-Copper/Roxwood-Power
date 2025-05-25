// 📦 consommation.js (corrigé avec archivage sécurisé et message dans le thread)
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

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const CONSO_CHANNEL_ID = '1374906428418031626';
const ROLE_ADMIN_ID = '1374863891296682185'; // Rôle développeur Roxwood

const couleurs = {
  rouge: 0xFF0000,
  orange: 0xFFA500,
  vert: 0x00FF00,
  bleu: 0x0099FF
};

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  // Archive auto vendredi 23:59
  setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 5 && now.getHours() === 23 && now.getMinutes() === 59) {
      const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
      const thread = await channel.threads.create({
        name: `📎 Archives - Semaine ${now.toLocaleDateString('fr-FR')}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
      });

      const messages = await channel.messages.fetch({ limit: 100 });
      messages.forEach(async msg => {
        if (msg.embeds.length) {
          await thread.send({ embeds: msg.embeds });
          await msg.delete().catch(() => {});
        }
      });
    }
  }, 60 * 1000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  // Commande /creer-embed
  if (interaction.isChatInputCommand() && interaction.commandName === 'creer-embed') {
    if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
      return interaction.reply({ content: 'Tu n’as pas la permission.', flags: 1 << 6 });
    }

    const entreprise = interaction.options.getString('entreprise');
    const couleur = interaction.options.getString('couleur');
    const objectif = interaction.options.getInteger('objectif_litre');

    const embed = new EmbedBuilder()
      .setTitle(`📊 Suivi de consommation - ${entreprise}`)
      .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Consommation actuelle :** \`0 L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
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
    await interaction.reply({ content: `Embed créé pour ${entreprise}`, flags: 1 << 6 });
  }

  // Bouton Archiver
  if (interaction.isButton() && interaction.customId === 'archiver') {
    if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission.', flags: 1 << 6 });
    }

    await interaction.deferUpdate();

    try {
      const msg = await interaction.channel.messages.fetch(interaction.message.id);
      const archiveThread = await interaction.channel.threads.create({
        name: `📁 Archive - ${new Date().toLocaleDateString('fr-FR')}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
      });

      await archiveThread.send({ embeds: msg.embeds });
      await archiveThread.send({ content: `✅ Embed archivé par <@${interaction.user.id}>.` });
      await msg.delete().catch(() => {});
      console.log(`🗂️ Embed archivé par ${interaction.user.tag} dans ${archiveThread.name}`);
    } catch (err) {
      console.error('❌ Erreur pendant l’archivage :', err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);

