const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = '1363243114822766763';
const CONSO_CHANNEL_ID = '1374906428418031626';

const couleurs = {
  rouge: 0xFF0000,
  orange: 0xFFA500,
  vert: 0x00FF00,
  bleu: 0x0099FF
};

client.once('ready', async () => {
  console.log(`✅ Bot consommation connecté : ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('creer-embed')
      .setDescription('Crée un embed de consommation pour une entreprise')
      .addStringOption(opt =>
        opt.setName('entreprise')
          .setDescription('Nom de l’entreprise')
          .setRequired(true)
          .addChoices(
            { name: '𝐋𝐓𝐃 𝐑𝐨𝐱𝐰𝐨𝐨𝐝', value: '𝐋𝐓𝐃 𝐑𝐨𝐱𝐰𝐨𝐨𝐝' },
            { name: '𝐋𝐓𝐃 𝐒𝐚𝐧𝐝𝐲 𝐒𝐡𝐨𝐫𝐞𝐬', value: '𝐋𝐓𝐃 𝐒𝐚𝐧𝐝𝐲 𝐒𝐡𝐨𝐫𝐞𝐬' },
            { name: '𝐋𝐓𝐃 𝐋𝐢𝐭𝐭𝐥𝐞 𝐒𝐞𝐨𝐮𝐥', value: '𝐋𝐓𝐃 𝐋𝐢𝐭𝐭𝐥𝐞 𝐒𝐞𝐨𝐮𝐥' },
            { name: '𝐋𝐓𝐃 𝐆𝐫𝐨𝐯𝐞 𝐒𝐭𝐫𝐞𝐞𝐭', value: '𝐋𝐓𝐃 𝐆𝐫𝐨𝐯𝐞 𝐒𝐭𝐫𝐞𝐞𝐭' }
          )
      )
      .addStringOption(opt =>
        opt.setName('couleur')
          .setDescription('Couleur de l\'embed')
          .setRequired(true)
          .addChoices(
            { name: 'Rouge', value: 'rouge' },
            { name: 'Orange', value: 'orange' },
            { name: 'Vert', value: 'vert' },
            { name: 'Bleu', value: 'bleu' }
          )
      )
      .addIntegerOption(opt =>
        opt.setName('objectif_litre')
          .setDescription('Objectif en litres (ex: 10000)')
          .setRequired(true)
      )
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID_PWR, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Commande /creer-embed enregistrée');
  } catch (err) {
    console.error('❌ Erreur enregistrement slash command :', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'creer-embed') return;

  const entreprise = interaction.options.getString('entreprise');
  const couleur = interaction.options.getString('couleur');
  const objectif = interaction.options.getInteger('objectif_litre');

  const embed = new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${entreprise}`)
    .setDescription(`
━━━━━━━━━━━━━━━━━━
🏢 **Entreprise :** ${entreprise}

💧 **Consommation actuelle :** \`0 L\`
🎯 **Objectif de la semaine :** \`${objectif} L\`

📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}
━━━━━━━━━━━━━━━━━━
`)
    .setColor(couleurs[couleur] ?? 0x0099FF)
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();

  const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
  await channel.send({ embeds: [embed] });

  await interaction.reply({
    content: `✅ Embed envoyé pour **${entreprise}**`,
    flags: 1 << 6
  });
});

client.login(process.env.DISCORD_TOKEN_PWR);

