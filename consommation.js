require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const LIAISON_AJUSTEMENT_ID = '1375516696957292646';
const CONSO_CHANNEL_ID = '1374906428418031626';

const couleurs = {
  'LTD Grove Street': 0xFF0000,
  'LTD Sandy Shores': 0xFFA500,
  'LTD Little Seoul': 0x00FF00,
  'LTD Roxwood': 0x0099FF
};

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.channelId !== LIAISON_AJUSTEMENT_ID) return;
  if (!message.content.includes('Ajustement demandé par')) return;

  const regex = /par (LTD .+)\nQuantité: ([\d ]+) Litre/;
  const match = message.content.match(regex);

  if (!match) return;

  const nom = match[1].trim();
  const objectif = parseInt(match[2].replace(/\s/g, ''), 10);
  const couleur = couleurs[nom] ?? 0x888888;

  const embed = new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${nom}`)
    .setDescription(`\n💼 **Entreprise :** ${nom}\n💧 **Consommation actuelle :** \`0 L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
    .setColor(couleur)
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
  console.log(`📨 Embed envoyé pour ${nom} - ${objectif} L`);
});

client.login(process.env.DISCORD_TOKEN_PWR);
