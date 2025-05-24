// 📦 clear-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID_PWR;
const GUILD_ID = '1363243114822766763';
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

(async () => {
  try {
    console.log('🧹 Suppression de toutes les commandes slash...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    console.log('✅ Toutes les commandes ont été supprimées.');
  } catch (err) {
    console.error('❌ Erreur lors de la suppression des commandes :', err);
  }
})();
