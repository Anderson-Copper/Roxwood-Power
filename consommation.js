// 📦 consommation.js (test simple de détection de message)
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const LIAISON_AJUSTEMENT_ID = '1375516696957292646';
const CONSO_CHANNEL_ID = '1374906428418031626';

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.channelId !== LIAISON_AJUSTEMENT_ID) return;
  if (message.content.includes('LTD Grove Street')) {
    const channel = await client.channels.fetch(CONSO_CHANNEL_ID);
    channel.send('!');
    console.log('🔔 Message détecté, ! envoyé.');
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);





