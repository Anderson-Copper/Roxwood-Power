client.on('messageCreate', async message => {
  console.log(`📩 Message reçu dans salon ${message.channelId} : ${message.content}`);

  if (message.channelId === '1375152581307007056' && message.content.trim() === '1') {
    try {
      await message.react('✅');
      console.log('✅ Réaction envoyée');
    } catch (err) {
      console.error('❌ Erreur de réaction :', err);
    }
  }
});
