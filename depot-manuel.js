const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes,
  Events
} = require('discord.js');
require('dotenv').config(); // Pour Render si tu veux localement
const TOKEN = process.env.DISCORD_TOKEN_PWR;
const CLIENT_ID = process.env.CLIENT_ID_PWR;
const GUILD_ID = process.env.GUILD_ID_PWR;

const LOGS_PRODUCTION = '1376982976176324648';
const LOGS_LIVRAISON = '1375152581307007056';

const LTD_LIST = [
  { label: 'Grove Street', value: 'Grove Street' },
  { label: 'Little Seoul', value: 'Little Seoul' },
  { label: 'Sandy Shores', value: 'Sandy Shores' },
  { label: 'Roxwood', value: 'Roxwood' }
];

// Création du client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Interaction globale (slash + boutons)
client.on(Events.InteractionCreate, async interaction => {
  try {
    // Slash command
    if (interaction.isChatInputCommand() && interaction.commandName === 'creer-depot') {
      const type = interaction.options.getString('type');
      const ltd = interaction.options.getString('ltd');

      const embed = new EmbedBuilder()
        .setColor(type === 'production' ? 0x4caf50 : 0x2196f3)
        .setTitle(`Déclarer vos 200 bidons ${type === 'production' ? 'produits' : 'livrés'}`)
        .setDescription(`Cliquez sur le bouton pour déclarer une **${type}** de 200 bidons chez **${ltd}**.`);

      const button = new ButtonBuilder()
        .setCustomId(`declarer_${type}_${ltd}`)
        .setLabel(`Déclarer 200 ${type === 'production' ? 'produits' : 'livrés'}`)
        .setStyle(type === 'production' ? ButtonStyle.Success : ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // Bouton
    if (interaction.isButton()) {
      const customId = interaction.customId;
      let type, ltd;

      if (customId.startsWith('declarer_production_')) {
        type = 'production';
        ltd = customId.replace('declarer_production_', '');
      } else if (customId.startsWith('declarer_livraison_')) {
        type = 'livraison';
        ltd = customId.replace('declarer_livraison_', '');
      } else {
        return;
      }

      const logEmbed = new EmbedBuilder()
        .setColor(type === 'production' ? 0x4caf50 : 0x2196f3)
        .setTitle(type === 'production' ? 'Production déclarée' : 'Livraison déclarée')
        .addFields(
          { name: 'Employé', value: interaction.user.username, inline: true },
          { name: 'LTD', value: ltd, inline: true },
          { name: 'Quantité', value: '200 bidons', inline: true }
        )
        .setTimestamp();

      const channelId = type === 'production' ? LOGS_PRODUCTION : LOGS_LIVRAISON;
      const channel = await interaction.guild.channels.fetch(channelId);
      if (!channel) return await interaction.reply({ content: 'Erreur : salon introuvable.', flags: 64 });

      await channel.send({ embeds: [logEmbed] });
      await interaction.reply({ content: '✅ Déclaration envoyée avec succès !', flags: 64 });
    }
  } catch (error) {
    console.error('Erreur d’interaction :', error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Une erreur est survenue.', flags: 64 });
    }
  }
});

// Connexion
client.once('ready', () => {
  console.log(`🤖 Connecté en tant que ${client.user.tag}`);
});
client.login(TOKEN);

