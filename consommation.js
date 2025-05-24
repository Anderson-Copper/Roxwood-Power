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
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const CONSO_CHANNEL_ID = '1374906428418031626';
const LIAISON_AJUSTEMENT_ID = '1375516696957292646';
const LOG_DEPOT_ID = '1375152581307007056';
const ROLE_ADMIN_ID = '1375058990152548372';
const DATA_FILE = './data.json';

const couleurs = {
  'LTD Roxwood': 0x0099FF,
  'LTD Sandy Shores': 0xFFA500,
  'LTD Little Seoul': 0x00FF00,
  'LTD Grove Street': 0xFF0000
};

let data = {};
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateEmbed(entreprise, objectif, actuel = 0) {
  return new EmbedBuilder()
    .setTitle(`📊 Suivi de consommation - ${entreprise}`)
    .setDescription(`\n💼 **Entreprise :** ${entreprise}\n💧 **Consommation actuelle :** \`${actuel} L\`\n🎯 **Objectif de la semaine :** \`${objectif} L\`\n\n📅 Semaine du ${new Date().toLocaleDateString('fr-FR')}`)
    .setColor(couleurs[entreprise] || 0x0099FF)
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/2933/2933929.png')
    .setTimestamp();
}

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  // ⏰ Archive auto vendredi 23:59 + recréation samedi 00:00
  setInterval(async () => {
    const now = new Date();
    const heure = now.getHours();
    const minute = now.getMinutes();

    if (now.getDay() === 5 && heure === 23 && minute === 59) {
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

    if (now.getDay() === 6 && heure === 0 && minute === 0) {
      const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
      for (const [entreprise, { objectif }] of Object.entries(data)) {
        data[entreprise].actuel = 0;
        const embed = generateEmbed(entreprise, objectif, 0);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
        );
        await channel.send({ embeds: [embed], components: [row] });
      }
      saveData();
    }
  }, 60000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  if (interaction.isChatInputCommand() && interaction.commandName === 'creer-embed') {
    if (!interaction.member.roles.cache.has(ROLE_ADMIN_ID)) {
      return interaction.reply({ content: 'Tu n’as pas la permission.', ephemeral: true });
    }

    const entreprise = interaction.options.getString('entreprise');
    const couleur = interaction.options.getString('couleur');
    const objectif = interaction.options.getInteger('objectif_litre');
    data[entreprise] = { objectif, actuel: 0 };
    saveData();

    const embed = generateEmbed(entreprise, objectif, 0);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver').setLabel('🗂 Archiver').setStyle(ButtonStyle.Secondary)
    );

    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Embed créé pour ${entreprise}`, ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === 'archiver') {
    const msg = await interaction.channel.messages.fetch(interaction.message.id);
    const archiveThread = await interaction.channel.threads.create({
      name: `📁 Archive - ${new Date().toLocaleDateString('fr-FR')}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
    });
    await archiveThread.send({ embeds: msg.embeds });
    await msg.delete().catch(() => {});
    await interaction.reply({ content: 'Embed archivé avec succès.', ephemeral: true });
  }
});

client.on('messageCreate', async message => {
  if (!message.embeds.length) return;
  const embed = message.embeds[0];

  // Ajustements
  if (message.channelId === LIAISON_AJUSTEMENT_ID) {
    const match = embed.description.match(/LTD .*|\d{5,}/g);
    if (!match || match.length < 2) return;
    const entreprise = match[0].trim();
    const litres = parseInt(match[1]);
    if (!data[entreprise]) data[entreprise] = { objectif: litres, actuel: 0 };
    else data[entreprise].objectif = litres;
    saveData();

    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 100 });
    const msg = messages.find(m => m.embeds[0]?.title?.includes(entreprise));
    if (msg) {
      const newEmbed = generateEmbed(entreprise, litres, data[entreprise].actuel);
      await msg.edit({ embeds: [newEmbed] });
    }
  }

  // Dépôts
  if (message.channelId === LOG_DEPOT_ID) {
    const ltd = Object.keys(couleurs).find(nom => embed.description.includes(nom));
    const match = embed.description.match(/\d+/);
    if (!ltd || !match) return;
    const bidons = parseInt(match[0]);
    const litres = bidons * 15;
    if (!data[ltd]) return;
    data[ltd].actuel += litres;
    saveData();

    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 100 });
    const msg = messages.find(m => m.embeds[0]?.title?.includes(ltd));
    if (msg) {
      const newEmbed = generateEmbed(ltd, data[ltd].objectif, data[ltd].actuel);
      await msg.edit({ embeds: [newEmbed] });
    }
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);

