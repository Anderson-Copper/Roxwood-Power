require('dotenv').config();
const { REST, Routes } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID_PWR;
const GUILD_ID = '1363243114822766763';
const TOKEN = process.env.DISCORD_TOKEN_PWR;

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🧹 Suppression de TOUTES les commandes du bot dans le serveur...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    console.log('✅ Toutes les commandes du serveur ont été supprimées !');
  } catch (err) {
    console.error('❌ Erreur :', err);
  }
})();
