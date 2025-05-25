// ✅ TEST SIMPLE : Réagir avec ✅ quand on reçoit "1" dans le salon de dépôt
client.on('messageCreate', async message => {
  if (message.channelId === '1375152581307007056' && message.content.trim() === '1') {
    try {
      await message.react('✅');
      console.log('✅ Message détecté et réaction envoyée.');
    } catch (err) {
      console.error('❌ Erreur de réaction :', err);
    }
  }
});
