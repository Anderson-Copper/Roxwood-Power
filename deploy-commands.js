require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
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
        .setDescription('Couleur de l’embed')
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
        .setDescription('Objectif en litres')
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN_PWR);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID_PWR, process.env.GUILD_ID_PWR), { body: commands })
  .then(() => console.log('✅ Commandes slash enregistrées avec succès !'))
  .catch(console.error);
