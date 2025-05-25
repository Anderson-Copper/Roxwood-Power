// 📦 consommation.js (corrigé avec archivage sécurisé, message dans le thread, écoute des ajustements et archivage auto à chaque ajustement)
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

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const CONSO_CHANNEL_ID = '1374906428418031626';
const LIAISON_AJUSTEMENT_ID = '1375516696957292646';
const ROLE_ADMIN_ID = '1374863891296682185';
const USER_ID_AUTORISE = '1375516715026485268';

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

// 🎯 Écoute des ajustements dans le salon LIAISON
client.on('messageCreate', async message => {
  if (message.channelId !== LIAISON_AJUSTEMENT_ID) return;
  if (![
    USER_ID_AUTORISE,
    client.user.id,
    ...Array.from(message.guild?.roles?.cache?.get(ROLE_ADMIN_ID)?.members?.keys() || [])
  ].includes(message.author.id)) return;

  let entreprise, litres;

  // Cas 1 : message texte
  const matchText = message.content.match(/par (LTD [^\n]+)\nQuantité: (\d+)/);
  if (matchText) {
    entreprise = matchText[1];
    litres = matchText[2];
  }

  // Cas 2 : embed description
  if (!entreprise && message.embeds.length > 0) {
    const embed = message.embeds[0];
    const match = embed.description?.match(/par (LTD [^\n]+)\nQuantité: (\d+)/);
    if (match) {
      entreprise = match[1];
      litres = match[2];
    }
  }

  if (!entreprise || !litres) {
    console.warn('⚠️ Aucun ajustement détecté ou nom de LTD introuvable dans le message.');
    return;
  }

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 100 });
  const target = messages.find(msg => msg.embeds[0]?.title?.includes(entreprise));

  if (!target) {
    console.warn(`❌ Aucun embed trouvé pour ${entreprise} dans le salon consommation.`);
    return;
  }

  // Archiver l'ancien embed dans un fil
  const archiveThread = await channel.threads.create({
    name: `📁 Archive - ${entreprise} - ${new Date().toLocaleDateString('fr-FR')}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
  });
  await archiveThread.send({ embeds: target.embeds });
  await archiveThread.send({ content: `✅ Objectif mis à jour automatiquement pour ${entreprise}.` });

  const embed = EmbedBuilder.from(target.embeds[0]);
  const desc = embed.data.description || '';
  const updatedDesc = desc.replace(/🎯 \*\*Objectif :\*\* `.*? L`/, `🎯 **Objectif :** \`${litres} L\``);
  embed.setDescription(updatedDesc);

  await target.edit({ embeds: [embed] });
  console.log(`📌 Objectif mis à jour pour ${entreprise} → ${litres} L`);
});

client.login(process.env.DISCORD_TOKEN_PWR);




