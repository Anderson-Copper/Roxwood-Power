// 📦 depot-detector.js (script indépendant pour dépôts)
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const LIAISON_DEPOTS_ID = '1375152581307007056'; // Salon des dépôts
const CONSO_CHANNEL_ID = '1374906428418031626'; // Salon des suivis consommation

const LTD_couleurs = {
  'LTD Grove Street': 0xFF0000,
  'LTD Sandy Shores': 0xFFA500,
  'LTD Little Seoul': 0x00FF00,
  'LTD Roxwood': 0x0099FF
};

client.once('ready', () => {
  console.log(`🚀 Script de détection des dépôts lancé avec ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.channelId !== LIAISON_DEPOTS_ID) return;

  // ➕ Détection dépôt via embed
  if (message.embeds.length > 0) {
    const embed = message.embeds[0];
    const entreprise = embed.title?.match(/LTD .+/)?.[0];
    const quantite = embed.fields?.find(f => f.name.includes('Quantité'))?.value.match(/(\d+)/)?.[0];
    if (!entreprise || !quantite) return;

    const ajout = parseInt(quantite) * 15;
    const color = LTD_couleurs[entreprise];
    if (!color) return;

    const consoChannel = await client.channels.fetch(CONSO_CHANNEL_ID);
    const messages = await consoChannel.messages.fetch({ limit: 50 });
    const cible = messages.find(m => m.embeds[0]?.title?.includes(entreprise));
    if (!cible) return;

    const oldEmbed = cible.embeds[0];
    const actuel = parseInt(oldEmbed.description.match(/Volume livré : `?(\d+) L`?/)?.[1] || 0);
    const objectif = parseInt(oldEmbed.description.match(/Objectif : `?(\d+) L`?/)?.[1] || 0);

    const newEmbed = new EmbedBuilder()
      .setTitle(`📊 Suivi de consommation - ${entreprise}`)
      .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Volume livré :** \`${actuel + ajout} L\`\n🎯 **Objectif :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
      .setColor(color)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
      .setTimestamp();

    await cible.edit({ embeds: [newEmbed], components: cible.components });
    console.log(`📦 Mise à jour après dépôt pour ${entreprise} : +${ajout} L`);
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);
