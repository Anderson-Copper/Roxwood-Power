require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID_PWR;
const GUILD_ID = '1363243114822766763';

const commandes = [
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
    .addIntegerOption(option =>
      option.setName('objectif_litre')
        .setDescription('Objectif de litres')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

(async () => {
  try {
    console.log('🔁 Mise à jour des commandes slash...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commandes });
    console.log('✅ Commandes slash enregistrées avec succès !');
  } catch (error) {
    console.error('❌ Erreur mise à jour des commandes :', error);
  }
})();

