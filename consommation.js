// 📦 consommation.js (test 1 => 0 dans même salon)
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const SALON_TEST = '1375516696957292646';

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.channelId !== SALON_TEST) return;
  if (message.content.trim() === '1') {
    await message.channel.send('0');
    console.log('🔁 Réponse envoyée : 0');
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);
