// Script "bienvenu.js" - Secrétaire Roxwood PWR
// Gère l'arrivée des nouveaux citoyens avec message d'accueil + validation du règlement

const { Client, GatewayIntentBits, Partials, EmbedBuilder, Events, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.GuildMember],
});

// Variables principales
const WELCOME_CHANNEL_ID = '1363243115397382156'; // #bienvenu
const RULES_CHANNEL_ID = '1374827632402894888';   // #règlement
const CITOYEN_ROLE_ID = '1375087663107018833';     // Rôle Citoyen

client.once(Events.ClientReady, () => {
    console.log(`Secrétaire Roxwood PWR opérationnelle en tant que ${client.user.tag}`);
});

// 🎉 Nouveau membre arrivant
client.on(Events.GuildMemberAdd, async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`📢 Bienvenue ${member.user.username} chez Roxwood Power`)
        .setDescription(`
Vous entrez dans une **zone industrielle sécurisée et hautement dangereuse**.

🔒 Respectez **scrupuleusement les protocoles** en vigueur pour garantir votre sécurité et celle d'autrui.

🏫 L'accès au site est restreint - **Agents autorisés uniquement**.

📄 Consultez notre <#${RULES_CHANNEL_ID}> avant toute opération.

💬 Pour nos partenaires, rendez-vous dans les salons **prise de rendez-vous** et **demande de rôle**.
        `)
        .setImage('https://i.imgur.com/2nCt3Sbl.jpg') // Remplace par une image personnalisée si souhaité
        .setFooter({ text: 'Secrétaire Roxwood – Accueil des citoyens' });

    channel.send({ content: `Bienvenue ${member}!`, embeds: [embed] });
});

// ✅ Interaction bouton validation règlement
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'accepter_reglement') return;

    const role = interaction.guild.roles.cache.get(CITOYEN_ROLE_ID);
    if (!role) {
        return interaction.reply({ content: 'Le rôle Citoyen est introuvable.', ephemeral: true });
    }

    await interaction.member.roles.add(role);
    await interaction.reply({ content: 'Règlement accepté ! Tu as maintenant accès à tous les salons.', ephemeral: true });
});

module.exports = client;

