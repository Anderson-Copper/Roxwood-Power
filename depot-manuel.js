// ✅ Script complet : depot-manuel.js (format embed standardisé + deferReply)
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
    logo: 'https://i.postimg.cc/fRJMFbQD/groove.jpg'
  },
  'Little Seoul': {
    color: 0x00ff00, // Vert
    logo: 'https://i.postimg.cc/W1CsPPsr/Seoul-LTD-3.png'
  },
  'Sandy Shores': {
    color: 0xffa500, // Orange
    logo: 'https://i.postimg.cc/nztZCYjh/sandy.png'
  },
  'Roxwood': {
    color: 0x0000ff, // Bleu
    logo: 'https://i.postimg.cc/0NkF3Wwm/logo.png'
  }
};


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'creer-depot') {
      await interaction.deferReply();

      const type = interaction.options.getString('type');
      const ltd = interaction.options.getString('ltd');

      if (type === 'production') {
        const embed = new EmbedBuilder()
          .setColor(0x4caf50)
          .setTitle('Déclarer votre production de 200 bidons')
          .setDescription(`Cliquez sur le bouton ci-dessous pour déclarer votre production.`)
          .setThumbnail('https://i.postimg.cc/3xqNVnCW/bidon-d-essence.png'); // icône de bidon

        const button = new ButtonBuilder()
          .setCustomId(`declarer_production_global`)
          .setLabel(`🛢️ Déclarer 200 bidons`)
          .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);
        await interaction.editReply({ embeds: [embed], components: [row] });

      } else {
        const config = LTD_CONFIG[ltd] ?? { color: 0x808080, logo: null };

        const embed = new EmbedBuilder()
          .setColor(config.color)
          .setTitle(`Déposer 200 bidons (livraison)`)
          .setDescription(`Cliquez sur le bouton pour déposer 200 bidons chez **${ltd}**.`)
          .setThumbnail(config.logo);

        const button = new ButtonBuilder()
          .setCustomId(`declarer_livraison_${ltd}`)
          .setLabel(`Déclarer 200 livrés`)
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);
        await interaction.editReply({ embeds: [embed], components: [row] });
      }
    }

    if (interaction.isButton()) {
      const customId = interaction.customId;
      let type, ltd;

      if (customId === 'declarer_production_global') {
        type = 'production';
        ltd = 'Global';
      } else if (customId.startsWith('declarer_livraison_')) {
        type = 'livraison';
        ltd = customId.replace('declarer_livraison_', '');
      } else return;

      const config = LTD_CONFIG[ltd] ?? { color: 0x808080, logo: null };
      const nickname = interaction.member?.nickname || interaction.user.username;

      const logEmbed = new EmbedBuilder()
        .setColor(config.color)
        .setAuthor({ name: nickname })
        .setTitle(`LTD ${ltd}`)
        .addFields(
          { name: 'Quantité déposé', value: '200', inline: true },
          { name: "Prix à l'unité", value: '0', inline: true },
          { name: 'Salaire', value: '0', inline: true }
        )
        .setThumbnail(config.logo)
        .setTimestamp();

      const channelId = type === 'production' ? LOGS_PRODUCTION : LOGS_LIVRAISON;
      const channel = await interaction.guild.channels.fetch(channelId);
      if (channel) await channel.send({ embeds: [logEmbed] });

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




