require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

(async () => {
  try {
    const cmds = await rest.get(
      Routes.applicationGuildCommands(process.env.CLIENT_ID_PWR, process.env.GUILD_ID_PWR)
    );
    console.log('🧾 Commandes enregistrées :');
    for (const cmd of cmds) {
      console.log(`- /${cmd.name}`);
    }
  } catch (err) {
    console.error('❌ Erreur :', err);
  }
})();
