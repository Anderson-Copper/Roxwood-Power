// ✅ Script complet : depot-manuel.js (bot bouton infini et embed colorés)
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events
} = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN_PWR;
const LOGS_PRODUCTION = '1376982976176324648';
const LOGS_LIVRAISON = '1375152581307007056';

// 🎨 Couleurs + Logos pour chaque LTD
const LTD_CONFIG = {
  'Grove Street': {
    color: 0xff0000, // Rouge
    logo: 'https://link-to-logo-grove.png'
  },
  'Little Seoul': {
    color: 0x00ff00, // Vert
    logo: 'https://link-to-logo-seoul.png'
  },
  'Sandy Shores': {
    color: 0xffa500, // Orange
    logo: 'https://link-to-logo-sandy.png'
  },
  'Roxwood': {
    color: 0x0000ff, // Bleu
    logo: 'https://link-to-logo-roxwood.png'
  }
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.InteractionCreate, async interaction => {
  try {
    // 📌 Slash Commande : creer-depot
    if (interaction.isChatInputCommand() && interaction.commandName === 'creer-depot') {
      const type = interaction.options.getString('type');
      const ltd = interaction.options.getString('ltd');
      const config = LTD_CONFIG[ltd] ?? { color: 0x808080, logo: null };

      const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(`Déclarer vos 200 bidons ${type === 'production' ? 'produits' : 'livrés'}`)
        .setDescription(`Cliquez sur le bouton pour déclarer une **${type}** de 200 bidons chez **${ltd}**.`)
        .setThumbnail(config.logo);

      const button = new ButtonBuilder()
        .setCustomId(`declarer_${type}_${ltd}`)
        .setLabel(`Déclarer 200 ${type === 'production' ? 'produits' : 'livrés'}`)
        .setStyle(type === 'production' ? ButtonStyle.Success : ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);
      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // 📌 Bouton : déclarer_production_* ou déclarer_livraison_*
    if (interaction.isButton()) {
      const customId = interaction.customId;
      let type, ltd;

      if (customId.startsWith('declarer_production_')) {
        type = 'production';
        ltd = customId.replace('declarer_production_', '');
      } else if (customId.startsWith('declarer_livraison_')) {
        type = 'livraison';
        ltd = customId.replace('declarer_livraison_', '');
      } else return;

      const config = LTD_CONFIG[ltd] ?? { color: 0x808080, logo: null };

      const logEmbed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(type === 'production' ? 'Production déclarée' : 'Livraison déclarée')
        .setThumbnail(config.logo)
        .addFields(
          { name: 'Employé', value: interaction.user.username, inline: true },
          { name: 'LTD', value: ltd, inline: true },
          { name: 'Quantité', value: '200 bidons', inline: true }
        )
        .setTimestamp();

      const channelId = type === 'production' ? LOGS_PRODUCTION : LOGS_LIVRAISON;
      const channel = await interaction.guild.channels.fetch(channelId);

      if (channel) await channel.send({ embeds: [logEmbed] });

      // Répondre une seule fois, si non déjà fait
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: '✅ Déclaration envoyée avec succès !', flags: 64 });
        } catch (err) {
          console.warn('⚠️ Réponse déjà envoyée :', err.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur d’interaction :', error);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
      } catch (_) {}
    }
  }
});

client.once('ready', () => {
  console.log(`🤖 Connecté en tant que ${client.user.tag}`);
});

client.login(TOKEN);


