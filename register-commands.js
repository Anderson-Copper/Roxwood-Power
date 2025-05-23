require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID_PWR;
const GUILD_ID = '1363243114822766763';
const TOKEN = process.env.DISCORD_TOKEN_PWR;

const commandes = [
  new SlashCommandBuilder()
    .setName('creer-embed')
    .setDescription('Crée un embed de consommation pour une entreprise')
    .addStringOption(option =>
      option.setName('entreprise')
        .setDescription('Nom de l’entreprise')
        .setRequired(true)
        .addChoices(
          { name: '𝐋𝐓𝐃 𝐑𝐨𝐱𝐰𝐨𝐨𝐝', value: '𝐋𝐓𝐃 𝐑𝐨𝐱𝐰𝐨𝐨𝐝' },
          { name: '𝐋𝐓𝐃 𝐒𝐚𝐧𝐝𝐲 𝐒𝐡𝐨𝐫𝐞𝐬', value: '𝐋𝐓𝐃 𝐒𝐚𝐧𝐝𝐲 𝐒𝐡𝐨𝐫𝐞𝐬' },
          { name: '𝐋𝐓𝐃 𝐋𝐢𝐭𝐭𝐥𝐞 𝐒𝐞𝐨𝐮𝐥', value: '𝐋𝐓𝐃 𝐋𝐢𝐭𝐭𝐥𝐞 𝐒𝐞𝐨𝐮𝐥' },
          { name: '𝐋𝐓𝐃 𝐆𝐫𝐨𝐯𝐞 𝐒𝐭𝐫𝐞𝐞𝐭', value: '𝐋𝐓𝐃 𝐆𝐫𝐨𝐯𝐞 𝐒𝐭𝐫𝐞𝐞𝐭' }
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
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🧹 Suppression des anciennes commandes...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    console.log('🛠️ Enregistrement de la nouvelle commande...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commandes }
    );

    console.log('✅ Nouvelle commande /creer-embed bien enregistrée.');
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
})();
