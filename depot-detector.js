// ✅ depot-detector.js — Test simple 1 ➜ 0
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const LIAISON_DEPOTS_ID = '1375152581307007056';
const CONSO_CHANNEL_ID = '1374906428418031626';

client.once('ready', () => {
  console.log(`🧪 Bot dépôt prêt : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.channelId !== LIAISON_DEPOTS_ID) return;
  if (message.author.bot) return;

  if (message.content.trim() === '1') {
    const consoChannel = await client.channels.fetch(CONSO_CHANNEL_ID);
    await consoChannel.send('0');
    console.log('📤 Message "0" envoyé suite à "1" reçu.');
  }
});

client.login(process.env.DISCORD_TOKEN_PWR);

