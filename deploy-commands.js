const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('creer-embed')
    .setDescription('Crée les embeds de suivi consommation pour tous les LTD'),
  async execute(interaction) {
    // ce code n’est pas utilisé, car on gère la commande dans consommation.js directement
  },
};
