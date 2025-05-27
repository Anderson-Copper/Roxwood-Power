const { Client, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// IDs des salons de logs
const LOGS_PRODUCTION = '1376982976176324648';
const LOGS_LIVRAISON = '1375152581307007056';

// Liste des LTD
const LTD_LIST = [
  { label: 'Grove Street', value: 'Grove Street' },
  { label: 'Little Seoul', value: 'Little Seoul' },
  { label: 'Sandy Shores', value: 'Sandy Shores' },
  { label: 'Roxwood', value: 'Roxwood' }
];

// Lors du prêt du bot
client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

// Commande /creer-depot
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'creer-depot') {
    const type = interaction.options.getString('type');
    const ltd = interaction.options.getString('ltd');

    // Crée l'embed selon le type choisi
    let embed;
    let button;
    if (type === 'production') {
      embed = new EmbedBuilder()
        .setColor(0x4caf50)
        .setTitle("Déclarer vos 200 bidons produits")
        .setDescription(`Cliquez sur le bouton pour déclarer une production de 200 bidons chez **${ltd}**.`);
      button = new ButtonBuilder()
        .setCustomId(`declarer_production_${ltd}`)
        .setLabel('Déclarer 200 produits')
        .setStyle(ButtonStyle.Success);
    } else if (type === 'livraison') {
      embed = new EmbedBuilder()
        .setColor(0x2196f3)
        .setTitle("Déclarer vos 200 bidons livrés")
        .setDescription(`Cliquez sur le bouton pour déclarer une livraison de 200 bidons chez **${ltd}**.`);
      button = new ButtonBuilder()
        .setCustomId(`declarer_livraison_${ltd}`)
        .setLabel('Déclarer 200 livrés')
        .setStyle(ButtonStyle.Primary);
    } else {
      return interaction.reply({ content: 'Type inconnu.', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // Gestion du bouton
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

    const user = interaction.user;
    const embedLog = new EmbedBuilder()
      .setColor(type === 'production' ? 0x4caf50 : 0x2196f3)
      .setTitle(type === 'production' ? "Production déclarée" : "Livraison déclarée")
      .addFields(
        { name: "Employé", value: user.username, inline: true },
        { name: "LTD", value: ltd, inline: true },
        { name: "Quantité", value: "200 bidons", inline: true }
      )
      .setTimestamp();

    // Envoi dans le bon salon
    const channelId = type === 'production' ? LOGS_PRODUCTION : LOGS_LIVRAISON;
    const channel = await interaction.guild.channels.fetch(channelId);
    if (channel) {
      await channel.send({ embeds: [embedLog] });
      await interaction.reply({ content: 'Déclaration envoyée !', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Erreur : salon introuvable.', ephemeral: true });
    }
  }
});

// Enregistrement de la commande (exemple, à faire une seule fois)
client.on('ready', async () => {
  const data = new SlashCommandBuilder()
    .setName('creer-depot')
    .setDescription('Créer un dépôt manuel')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type de dépôt')
        .setRequired(true)
        .addChoices(
          { name: 'Production', value: 'production' },
          { name: 'Livraison', value: 'livraison' }
        ))
    .addStringOption(option =>
      option.setName('ltd')
        .setDescription('LTD concerné')
        .setRequired(true)
        .addChoices(...LTD_LIST.map(ltd => ({ name: ltd.label, value: ltd.value })))
    );
  await client.application.commands.create(data, '1376982976176324648'); // Remplace par l'ID de ton serveur
});

client.login(process.env.DISCORD_TOKEN_PWR); // Remplace par ton token
