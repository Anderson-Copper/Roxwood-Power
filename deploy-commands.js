// 📦 deploy-commands.js — Déploiement unique de toutes les commandes
require('dotenv').config();
const { SlashCommandBuilder, REST, Routes } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID_PWR;
const GUILD_ID = '1363243114822766763';

const commands = [
  // Commandes véhicules
  new SlashCommandBuilder()
    .setName('addvehicle')
    .setDescription('Ajoute un véhicule')
    .addStringOption(opt => opt.setName('nom').setDescription('Nom du véhicule').setRequired(true))
    .addStringOption(opt => opt.setName('id').setDescription('ID du véhicule').setRequired(true))
    .addStringOption(opt => opt.setName('plaque').setDescription("Plaque d'immatriculation").setRequired(true))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Image PNG du véhicule').setRequired(true)),

  new SlashCommandBuilder()
    .setName('removevehicle')
    .setDescription('Supprime un véhicule existant')
    .addStringOption(opt => opt.setName('id').setDescription('ID du véhicule à supprimer').setRequired(true)),

  new SlashCommandBuilder()
    .setName('listvehicles')
    .setDescription('Affiche la liste des véhicules'),

  new SlashCommandBuilder()
    .setName('reloadvehicles')
    .setDescription('Recharge tous les véhicules depuis les salons définis'),

  // Commande consommation
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
        .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

(async () => {
  try {
    console.log('🚀 Déploiement des commandes slash...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Commandes slash enregistrées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l’enregistrement des commandes :', error);
  }
})();
