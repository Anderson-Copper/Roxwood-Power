// 📆 deploy-commands.js
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID_PWR;
const GUILD_ID = '1363243114822766763';
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

const commands = [
  // 📌 Véhicules - Ajout
  new SlashCommandBuilder()
    .setName('addvehicle')
    .setDescription('Ajoute un véhicule')
    .addStringOption(opt => opt.setName('nom').setDescription('Nom du véhicule').setRequired(true))
    .addStringOption(opt => opt.setName('id').setDescription('ID du véhicule').setRequired(true))
    .addStringOption(opt => opt.setName('plaque').setDescription("Plaque d'immatriculation").setRequired(true))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Image PNG du véhicule').setRequired(true)),

  // 📌 Véhicules - Suppression
  new SlashCommandBuilder()
    .setName('removevehicle')
    .setDescription('Supprime un véhicule existant')
    .addStringOption(opt => opt.setName('id').setDescription('ID du véhicule à supprimer').setRequired(true)),

  // 📌 Véhicules - Liste
  new SlashCommandBuilder()
    .setName('listvehicles')
    .setDescription('Affiche la liste des véhicules'),

  // 📌 Véhicules - Reload
  new SlashCommandBuilder()
    .setName('reloadvehicles')
    .setDescription('Recharge tous les véhicules depuis les salons définis'),

  // 📌 Consommation - Création d'embed
  new SlashCommandBuilder()
    .setName('creer-embed')
    .setDescription('Crée un embed de consommation pour une entreprise')
    .addStringOption(option =>
      option.setName('entreprise')
        .setDescription('Nom de l’entreprise')
        .setRequired(true)
        .addChoices(
          { name: 'LTD Roxwood', value: 'LTD Roxwood' },
          { name: 'LTD Sandy Shores', value: 'LTD Sandy Shores' },
          { name: 'LTD Little Seoul', value: 'LTD Little Seoul' },
          { name: 'LTD Grove Street', value: 'LTD Grove Street' }
        )
    )
    .addStringOption(option =>
      option.setName('couleur')
        .setDescription('Couleur')
        .setRequired(true)
        .addChoices(
          { name: 'Rouge', value: 'rouge' },
          { name: 'Orange', value: 'orange' },
          { name: 'Vert', value: 'vert' },
          { name: 'Bleu', value: 'bleu' }
        )
    )
    .addIntegerOption(option =>
      option.setName('objectif_litre')
        .setDescription('Objectif de litres')
        .setRequired(true)
    ),

  // 🔄 Consommation - Reset hebdomadaire manuel
  new SlashCommandBuilder()
    .setName('reset-consommation')
    .setDescription('Archive et recrée tous les embeds de consommation'),

  // 📦 Dépôt Manuel - Création d'embed
  new SlashCommandBuilder()
    .setName('creer-depot')
    .setDescription('Créer un dépôt manuel')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type de dépôt')
        .setRequired(true)
        .addChoices(
          { name: 'Production', value: 'production' },
          { name: 'Livraison', value: 'livraison' }
        )
    )
    .addStringOption(option =>
      option.setName('ltd')
        .setDescription('LTD concerné')
        .setRequired(true)
        .addChoices(
          { name: 'Grove Street', value: 'Grove Street' },
          { name: 'Little Seoul', value: 'Little Seoul' },
          { name: 'Sandy Shores', value: 'Sandy Shores' },
          { name: 'Roxwood', value: 'Roxwood' }
        )
    )
].map(cmd => cmd.toJSON());

(async () => {
  try {
    console.log('🧹 Suppression des commandes existantes...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    console.log('🧽 Commandes précédentes supprimées.');

    console.log('🔁 Déploiement des commandes slash...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands }).
      then((value) => {console.log("then2", value)}).
      catch((error) => {console.error("error2", error)});
    console.log('✅ Commandes slash enregistrées avec succès !');
  }
})();



