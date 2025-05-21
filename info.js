// info.js

module.exports = {
  // ID du salon de commande
  channelCommandeID: '123456789012345678',

  // Webhooks par entreprise (exemple)
  webhooks: {
    "PetroCorp": "https://discord.com/api/webhooks/xxx/yyy",
    "FuelUnion": "https://discord.com/api/webhooks/aaa/bbb"
  },

  // Détection d'entreprise depuis l'embed
  detectionEntreprise: (embed) => {
    const nom = embed.title || embed.author?.name || "";
    for (const entreprise of Object.keys(module.exports.webhooks)) {
      if (nom.includes(entreprise)) {
        return { nom: entreprise, webhook: module.exports.webhooks[entreprise] };
      }
    }
    return null;
  },

  // Messages affichés lors du clic sur les boutons
  messages: {
    urgence: "⚡ Cette commande est maintenant prioritaire (urgence)",
    livre: "⛽ Livraison effectuée dans le réservoir partenaire",
    facture: "💳 Facture envoyée à l'IBAN communiqué",
    regle: "✅ Facture réglée et commande cloturée"
  }
// Fichier des véhicules persistants
  vehiculeDataFile: './vehicles.json'
};
