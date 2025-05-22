// info.js

module.exports = {
  // ID du salon de commande
  channelCommandeID: '123456789012345678',

  // Webhooks par entreprise (exemple)
  webhooks: {
    "🏙・𝐋𝐓𝐃-𝐆𝐫𝐨𝐯𝐞-𝐒𝐭𝐫𝐞𝐞𝐭": "https://discord.com/api/webhooks/1375137877134020812/dwEr-x3O29eV0DsYBEleQpTyv_xJGGIsigyUge4OVOqWLneaNv8uLSx1E16wWgHT5Lfa",
    "🏙・𝐋𝐓𝐃-𝐋𝐢𝐭𝐭𝐥𝐞-𝐒𝐞𝐨𝐮𝐥": "https://discord.com/api/webhooks/1375138603658772582/nXJgqKS-JBrs-7l-xXjhH74Zi8HfhjTHAaB14eEWTZHt0-0D_HKGmmaVRthTkSR_vuAi",
    "🏜・𝐋𝐓𝐃-𝐒𝐚𝐧𝐝𝐲-𝐒𝐡𝐨𝐫𝐞𝐬": "https://discord.com/api/webhooks/1375138664786559076/BSWJ_9Q8D5k8qkl-bhF9Nb8nNnh1OpfLSMUccOhZshTEjXchBaifzHgzbKUZdz69kotu",
    "🏞・𝐋𝐓𝐃-𝐑𝐨𝐱𝐰𝐨𝐨𝐝": "https://discord.com/api/webhooks/1375138709866807399/sSL_pPO9Wb-ojwA4PT86Di8j3-XOLHaAUcAKUGdhSYETY_IWdz2O8oZD_GlOSGqmnCyU"
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
  },

  vehiculeDataFile: './vehicles.json' // <-- bien incluse dans l'objet
};
