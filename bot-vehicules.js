// ✅ Version complète avec /reloadvehicles
require('dotenv').config();
const fs = require('fs');
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const GUILD_ID = '1363243114822766763';
const VEHICULE_ADMIN_ROLE_ID = '1374863891296682185';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const vehiclesPath = './vehicles.json';
let vehicles = fs.existsSync(vehiclesPath) ? require(vehiclesPath) : {};

function saveVehicles() {
  try {
    fs.writeFileSync(vehiclesPath, JSON.stringify(vehicles, null, 2));
    console.log('✅ Fichier vehicles.json mis à jour !');
  } catch (e) {
    console.error('❌ Erreur de sauvegarde :', e);
  }
}

function createVehicleEmbed(vehicle) {
  return new EmbedBuilder()
    .setTitle(`🚘 ${vehicle.nom} (${vehicle.id})`)
    .setColor(vehicle.disponible ? 0x2ecc71 : 0xe74c3c)
    .addFields(
      { name: '🆔 ID', value: vehicle.id, inline: true },
      { name: '📋 Plaque', value: vehicle.plaque, inline: true },
      { name: '📍 Disponible', value: vehicle.disponible ? '✅ Oui' : '❌ Non', inline: true },
      {
        name: '📜 Dernière utilisation',
        value: vehicle.derniere_utilisation
          ? `${vehicle.dernier_utilisateur} le ${vehicle.derniere_utilisation}`
          : 'Aucune donnée.'
      }
    )
    .setImage(vehicle.image);
}

function createVehicleButtons(id, disponible) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`use_${id}`).setLabel('Utiliser le véhicule').setStyle(ButtonStyle.Primary).setDisabled(!disponible),
    new ButtonBuilder().setCustomId(`release_${id}`).setLabel('Reposer le véhicule').setStyle(ButtonStyle.Secondary).setDisabled(disponible),
    new ButtonBuilder().setCustomId(`delete_${id}`).setLabel('🗑️ Supprimer').setStyle(ButtonStyle.Danger)
  );
}

async function resyncVehiclesFromChannels(channelIds = []) {
  for (const channelId of channelIds) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel.isTextBased()) continue;

      const messages = await channel.messages.fetch({ limit: 100 });
      for (const msg of messages.values()) {
        const embed = msg.embeds[0];
        if (!embed || !embed.title?.startsWith('🚘')) continue;

        const nomMatch = embed.title.match(/^🚘 (.+) \((.+)\)$/);
        if (!nomMatch) continue;

        const nom = nomMatch[1];
        const id = nomMatch[2];
        if (vehicles[id]) continue;

        const fields = Object.fromEntries(embed.fields.map(f => [f.name, f.value]));
        vehicles[id] = {
          id,
          nom,
          plaque: fields['📋 Plaque'] || '???',
          disponible: fields['📍 Disponible']?.includes('Oui'),
          dernier_utilisateur: (fields['📜 Dernière utilisation']?.match(/<@!?\d+>/) || [])[0] || 'Aucun',
          derniere_utilisation: fields['📜 Dernière utilisation']?.split(' le ')[1] || null,
          image: embed.image?.url || null,
          messageId: msg.id,
          channelId: msg.channel.id,
          threadId: msg.hasThread ? msg.thread.id : null,
          heure_debut: null
        };

        const updatedEmbed = createVehicleEmbed(vehicles[id]);
        const row = createVehicleButtons(id, vehicles[id].disponible);
        await msg.edit({ embeds: [updatedEmbed], components: [row] });

        console.log(`🧩 Véhicule récupéré depuis l'embed : ${id}`);
      }
    } catch (err) {
      console.warn(`⚠️ Erreur récupération salon ${channelId} : ${err.message}`);
    }
  }

  saveVehicles();
}

client.once('ready', async () => {
  console.log(`🚗 Bot véhicules Roxwood actif en tant que ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);
  const commands = [
    new SlashCommandBuilder()
      .setName('addvehicle')
      .setDescription('Ajoute un véhicule')
      .addStringOption(opt => opt.setName('nom').setDescription('Nom du véhicule').setRequired(true))
      .addStringOption(opt => opt.setName('id').setDescription('ID du véhicule').setRequired(true))
      .addStringOption(opt => opt.setName('plaque').setDescription("Plaque d'immatriculation").setRequired(true))
      .addAttachmentOption(opt => opt.setName('image').setDescription('Image PNG du véhicule').setRequired(true)),
    new SlashCommandBuilder().setName('listvehicles').setDescription('Affiche la liste des véhicules'),
    new SlashCommandBuilder()
      .setName('removevehicle')
      .setDescription('Supprime un véhicule existant')
      .addStringOption(opt => opt.setName('id').setDescription('ID du véhicule à supprimer').setRequired(true)),
    new SlashCommandBuilder()
      .setName('reloadvehicles')
      .setDescription('Recharge tous les véhicules depuis les salons définis')
  ].map(cmd => cmd.toJSON());

  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID_PWR, GUILD_ID), { body: commands });
    console.log('✅ Commandes slash mises à jour');
  } catch (error) {
    console.error('❌ Erreur mise à jour des commandes slash :', error);
  }

  await resyncVehiclesFromChannels([
    '1374865698882453596',
    '1374884208924692562',
    '1374884419818618920'
  ]);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'addvehicle') {
      await interaction.deferReply({ ephemeral: true });

      const nom = interaction.options.getString('nom');
      const id = interaction.options.getString('id');
      const plaque = interaction.options.getString('plaque');
      const image = interaction.options.getAttachment('image');

      if (vehicles[id]) {
        return interaction.editReply({ content: `🚫 Un véhicule avec l'ID \`${id}\` existe déjà.` });
      }

      const channel = interaction.channel;
      const embed = createVehicleEmbed({ id, nom, plaque, disponible: true, image: image.url });
      const row = createVehicleButtons(id, true);

      const msg = await channel.send({ embeds: [embed], components: [row] });
      const thread = await msg.startThread({ name: `🧾 ${nom}`, autoArchiveDuration: 1440 });

      vehicles[id] = {
        id,
        nom,
        plaque,
        disponible: true,
        dernier_utilisateur: null,
        derniere_utilisation: null,
        image: image.url,
        messageId: msg.id,
        channelId: msg.channel.id,
        threadId: thread.id,
        heure_debut: null
      };

      saveVehicles();
      await interaction.editReply({ content: `✅ Véhicule \`${nom}\` ajouté avec succès !` });
      return;
    }

    if (interaction.commandName === 'reloadvehicles') {
      await interaction.reply({ content: '🔁 Resynchronisation en cours...', ephemeral: true });

      await resyncVehiclesFromChannels([
        '1374865698882453596',
        '1374884208924692562',
        '1374884419818618920'
      ]);

      await interaction.editReply({ content: '✅ Véhicules resynchronisés avec succès !' });
      return;
    }
  }

  if (!interaction.isButton()) return;

  const [action, id] = interaction.customId.split('_');
  const vehicle = vehicles[id];
  if (!vehicle) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
    return;
  }

  try {
    const channel = await client.channels.fetch(vehicle.channelId);
    const message = await channel.messages.fetch(vehicle.messageId);

    if (action === 'use' && vehicle.disponible) {
      vehicle.disponible = false;
      vehicle.dernier_utilisateur = `<@${interaction.user.id}>`;
      vehicle.heure_debut = new Date();
      vehicle.derniere_utilisation = vehicle.heure_debut.toLocaleString('fr-FR');
      saveVehicles();
    }

    if (action === 'release' && !vehicle.disponible) {
      vehicle.disponible = true;
      const fin = new Date();
      const debut = vehicle.heure_debut ? new Date(vehicle.heure_debut) : null;
      const duree = debut ? Math.round((fin - debut) / 60000) : 0;

      const embed = new EmbedBuilder()
        .setTitle('📝 Historique d\'utilisation')
        .addFields(
          { name: '👤 Utilisateur', value: vehicle.dernier_utilisateur ?? 'Inconnu', inline: true },
          { name: '📅 Date', value: debut ? debut.toLocaleDateString('fr-FR') : 'N/A', inline: true },
          { name: '🕓 De', value: debut ? debut.toLocaleTimeString('fr-FR') : 'N/A', inline: true },
          { name: '🕔 À', value: fin.toLocaleTimeString('fr-FR'), inline: true },
          { name: '🕘 Durée', value: `${duree} minutes`, inline: true }
        )
        .setTimestamp();

      if (vehicle.threadId) {
        try {
          const thread = await client.channels.fetch(vehicle.threadId);
          await thread.send({ embeds: [embed] });
        } catch (err) {
          console.warn(`⚠️ Thread introuvable pour le véhicule ${vehicle.id}`);
        }
      }
      saveVehicles();
    }

    if (action === 'delete') {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(VEHICULE_ADMIN_ROLE_ID)) {
        return interaction.reply({ content: '🚫 Tu n’as pas le droit de faire ça.', flags: 1 << 6 });
      }

      await message.delete();
      if (vehicle.threadId) {
        try {
          const thread = await client.channels.fetch(vehicle.threadId);
          await thread.delete();
        } catch (err) {
          console.warn(`⚠️ Impossible de supprimer le thread : ${err.message}`);
        }
      }

      delete vehicles[id];
      saveVehicles();
      return;
    }

    const updatedEmbed = createVehicleEmbed(vehicle);
    const updatedRow = createVehicleButtons(id, vehicle.disponible);
    await message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
    await interaction.deferUpdate().catch(() => {});
  } catch (err) {
    console.warn(`❌ Interaction échouée pour ${id} : ${err.message}`);
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);



