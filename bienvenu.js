// Script "bienvenu.js" - Secrétaire Roxwood PWR
// Envoie un message simple à chaque connexion du bot (simulant l'accueil de membres)

const { Client, GatewayIntentBits, Events } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const WELCOME_CHANNEL_ID = '1363243115397382156'; // #bienvenu

client.once(Events.ClientReady, async () => {
    console.log(`Secrétaire Roxwood PWR opérationnelle en tant que ${client.user.tag}`);

    const guild = await client.guilds.fetch(process.env.GUILD_ID_PWR);
    const channel = guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    await channel.send(`👋 Un nouveau citoyen vient d’arriver chez Roxwood ! Pensez à lui souhaiter la bienvenue.`);
});

module.exports = client;
