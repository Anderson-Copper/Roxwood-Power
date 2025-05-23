require('dotenv').config();
const { REST, Routes } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID_PWR;
const TOKEN = process.env.DISCORD_TOKEN_PWR;

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🧹 Suppression de toutes les commandes globales...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log('✅ Toutes les commandes globales ont été supprimées.');
  } catch (err) {
    console.error('❌ Erreur suppression globale :', err);
  }
})();
